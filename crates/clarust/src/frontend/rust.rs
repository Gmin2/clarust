use std::collections::HashSet;

use proc_macro2::LineColumn;
use syn::punctuated::Punctuated;
use syn::spanned::Spanned;
use syn::{
    BinOp, Expr as RExpr, FnArg, GenericArgument, Item, Lit, Pat, PathArguments, Stmt as RStmt,
    Type as RType, UnOp,
};

use crate::frontend::{builtin_call, kebab, Frontend};
use crate::ir::*;

pub struct RustFrontend;

impl Frontend for RustFrontend {
    fn name(&self) -> &str {
        "rust"
    }

    fn parse(&self, source: &str) -> Result<Contract, String> {
        let file = syn::parse_file(source).map_err(|e| format!("parse error: {e}"))?;
        let src = Src::new(source);
        parse_real(&file, &src)
    }
}

// reads the real-rust, anchor-style shape: a `#[contract] struct` whose fields are
// storage, and a `#[contract_impl] impl` whose methods are functions
fn parse_real(file: &syn::File, src: &Src) -> Result<Contract, String> {
    let st = file
        .items
        .iter()
        .find_map(|it| match it {
            Item::Struct(s) if has_attr(&s.attrs, "contract") => Some(s),
            _ => None,
        })
        .ok_or("no `#[contract] struct` found")?;

    let mut lower = Lower {
        src,
        vars: HashSet::new(),
        maps: HashSet::new(),
    };

    // first pass: register storage names so method bodies resolve them
    for f in &st.fields {
        if let (Some(name), Some(kind)) = (field_name(f), storage_kind(&f.ty)) {
            match kind {
                StorageKind::Var => {
                    lower.vars.insert(name);
                }
                StorageKind::Map => {
                    lower.maps.insert(name);
                }
                _ => {}
            }
        }
    }

    let mut decls = Vec::new();

    // trait conformance is an attribute on the struct
    for attr in &st.attrs {
        if attr.path().is_ident("impl_trait") {
            if let Ok(s) = attr.parse_args::<syn::LitStr>() {
                decls.push(Decl::ImplTrait {
                    target: s.value(),
                    src: Some(src.prov(attr)),
                });
            }
        }
    }

    // top-level consts (error codes etc)
    for it in &file.items {
        if let Item::Const(c) = it {
            let ty = lower_type(&c.ty)?;
            let value = lower.value_atom(&c.expr, &ty);
            decls.push(Decl::Const {
                name: kebab(&c.ident.to_string()),
                ty,
                value,
                src: Some(src.prov(c)),
            });
        }
    }

    // storage decls, in field order
    for f in &st.fields {
        let name = field_name(f).ok_or("contract struct fields must be named")?;
        match storage_kind(&f.ty) {
            Some(StorageKind::Var) => decls.push(Decl::DataVar {
                name,
                ty: storage_inner(&f.ty, 0)?,
                init: default_for(&storage_inner(&f.ty, 0)?),
                src: Some(src.prov(f)),
            }),
            Some(StorageKind::Map) => decls.push(Decl::Map {
                name,
                key: storage_inner(&f.ty, 0)?,
                val: storage_inner(&f.ty, 1)?,
                src: Some(src.prov(f)),
            }),
            Some(StorageKind::Ft) => decls.push(Decl::Ft { name, src: Some(src.prov(f)) }),
            Some(StorageKind::Nft) => decls.push(Decl::Nft {
                name,
                id_ty: storage_inner(&f.ty, 0)?,
                src: Some(src.prov(f)),
            }),
            None => return Err(format!("field `{name}` has an unsupported storage type")),
        }
    }

    // methods become functions
    for it in &file.items {
        if let Item::Impl(imp) = it {
            if !has_attr(&imp.attrs, "contract_impl") {
                continue;
            }
            for m in &imp.items {
                let syn::ImplItem::Fn(f) = m else { continue };
                let Some(vis) = fn_vis(&f.attrs) else { continue };
                if uses_loop(&f.block.stmts) {
                    return Err(format!(
                        "fn `{}` uses a loop; clarity has no unbounded iteration, rewrite with fold/map/filter",
                        f.sig.ident
                    ));
                }
                decls.push(Decl::Func {
                    name: kebab(&f.sig.ident.to_string()),
                    vis,
                    params: lower_params(&f.sig.inputs)?,
                    body: lower.block(&f.block.stmts),
                    src: Some(src.prov(&f.sig)),
                });
            }
        }
    }

    Ok(Contract {
        name: kebab(&st.ident.to_string()),
        decls,
    })
}

enum StorageKind {
    Var,
    Map,
    Ft,
    Nft,
}

fn storage_kind(ty: &RType) -> Option<StorageKind> {
    match outer_name(ty)?.as_str() {
        "DataVar" => Some(StorageKind::Var),
        "Map" => Some(StorageKind::Map),
        "FungibleToken" => Some(StorageKind::Ft),
        "NonFungibleToken" => Some(StorageKind::Nft),
        _ => None,
    }
}

fn outer_name(ty: &RType) -> Option<String> {
    if let RType::Path(tp) = ty {
        return tp.path.segments.last().map(|s| s.ident.to_string());
    }
    None
}

// the nth generic argument of a storage wrapper type, lowered to an IR type
fn storage_inner(ty: &RType, idx: usize) -> Result<Type, String> {
    let RType::Path(tp) = ty else {
        return Err("expected a path type".into());
    };
    let seg = tp.path.segments.last().ok_or("empty type")?;
    let gens = generic_types(&seg.arguments);
    let inner = gens.get(idx).ok_or("missing type parameter")?;
    lower_type(inner)
}

fn field_name(f: &syn::Field) -> Option<String> {
    f.ident.as_ref().map(|i| kebab(&i.to_string()))
}

fn default_for(ty: &Type) -> Expr {
    match ty {
        Type::Int => Expr::Atom("0".into()),
        Type::Bool => Expr::Atom("false".into()),
        _ => Expr::Atom("u0".into()),
    }
}

struct Lower<'a> {
    src: &'a Src,
    vars: HashSet<String>,
    maps: HashSet<String>,
}

impl Lower<'_> {
    fn block(&self, stmts: &[RStmt]) -> Vec<Stmt> {
        let mut out = Vec::new();
        for s in stmts {
            match s {
                RStmt::Local(local) => {
                    let name = pat_ident(&local.pat).unwrap_or_else(|_| "_".into());
                    let value = match &local.init {
                        Some(init) => self.expr(&init.expr),
                        None => Expr::Atom("none".into()),
                    };
                    out.push(Stmt::Let {
                        name: kebab(&name),
                        value,
                        src: Some(self.src.prov(s)),
                    });
                }
                RStmt::Expr(e, _) => out.push(Stmt::Do {
                    value: self.expr(e),
                    src: Some(self.src.prov(s)),
                }),
                _ => {}
            }
        }
        out
    }

    // inline lowering for blocks in expression position, e.g. an if arm
    fn block_expr(&self, stmts: &[RStmt]) -> Expr {
        if stmts.is_empty() {
            return Expr::Atom("true".into());
        }
        match &stmts[0] {
            RStmt::Local(local) => {
                let name = pat_ident(&local.pat).unwrap_or_else(|_| "_".into());
                let value = match &local.init {
                    Some(init) => self.expr(&init.expr),
                    None => Expr::Atom("none".into()),
                };
                Expr::Let(
                    kebab(&name),
                    Box::new(value),
                    Box::new(self.block_expr(&stmts[1..])),
                )
            }
            RStmt::Expr(e, _) => {
                if stmts.len() == 1 {
                    self.expr(e)
                } else {
                    Expr::Begin(vec![self.expr(e), self.block_expr(&stmts[1..])])
                }
            }
            _ => self.block_expr(&stmts[1..]),
        }
    }

    fn expr(&self, e: &RExpr) -> Expr {
        match e {
            RExpr::Lit(l) => Expr::Atom(lit_atom(&l.lit)),
            RExpr::Paren(p) => self.expr(&p.expr),
            RExpr::Group(g) => self.expr(&g.expr),
            RExpr::Block(b) => self.block_expr(&b.block.stmts),
            RExpr::Path(p) => {
                let name = p
                    .path
                    .segments
                    .last()
                    .map(|s| s.ident.to_string())
                    .unwrap_or_default();
                Expr::Atom(match name.as_str() {
                    "None" => "none".into(),
                    "true" => "true".into(),
                    "false" => "false".into(),
                    other => kebab(other),
                })
            }
            RExpr::Unary(u) => match u.op {
                UnOp::Not(_) => Expr::Call("not".into(), vec![self.expr(&u.expr)]),
                _ => Expr::Call("-".into(), vec![self.expr(&u.expr)]),
            },
            RExpr::Binary(b) => {
                let l = self.expr(&b.left);
                let r = self.expr(&b.right);
                match binop(&b.op) {
                    Some("ne") => Expr::Call(
                        "not".into(),
                        vec![Expr::Call("is-eq".into(), vec![l, r])],
                    ),
                    Some(op) => Expr::Call(op.into(), vec![l, r]),
                    None => Expr::Call("??".into(), vec![l, r]),
                }
            }
            RExpr::If(if_expr) => {
                let cond = self.expr(&if_expr.cond);
                let then = self.block_expr(&if_expr.then_branch.stmts);
                let els = match &if_expr.else_branch {
                    Some((_, e)) => self.expr(e),
                    None => Expr::Atom("true".into()),
                };
                Expr::If(Box::new(cond), Box::new(then), Box::new(els))
            }
            RExpr::Field(_) => match receiver_field(e) {
                Some(name) if self.vars.contains(&name) => {
                    Expr::Call("var-get".into(), vec![atom(&name)])
                }
                Some(name) => Expr::Atom(name),
                None => Expr::Atom(";; unsupported field access".into()),
            },
            RExpr::Call(call) => {
                let fname = path_name(&call.func);
                // Uint(1) / Int(1) are the real-rust way to write a typed literal
                if let (Some(suffix), [RExpr::Lit(l)]) =
                    (type_ctor(&fname), call.args.iter().collect::<Vec<_>>().as_slice())
                {
                    if let Lit::Int(i) = &l.lit {
                        return Expr::Atom(format!("{suffix}{}", i.base10_digits()));
                    }
                }
                // nullary keyword like tx_sender() -> bare clarity keyword
                if call.args.is_empty() {
                    if let Some(kw) = keyword(&fname) {
                        return Expr::Atom(kw.into());
                    }
                }
                let mut args: Vec<Expr> = call.args.iter().map(|a| self.expr(a)).collect();
                // asserts(cond, code) guards a public fn: (asserts! cond (err code))
                if fname == "asserts" && args.len() == 2 {
                    let code = args.pop().unwrap();
                    let cond = args.pop().unwrap();
                    return Expr::Call(
                        "asserts!".into(),
                        vec![cond, Expr::Call("err".into(), vec![code])],
                    );
                }
                builtin_call(&fname, args)
            }
            RExpr::MethodCall(m) => {
                let method = m.method.to_string();
                let args: Vec<Expr> = m.args.iter().map(|a| self.expr(a)).collect();
                let recv_name = receiver_field(&m.receiver);
                self.lower_method(recv_name.as_deref(), &m.receiver, &method, args)
            }
            other => Expr::Atom(format!(";; unsupported expr {:?}", std::mem::discriminant(other))),
        }
    }

    fn lower_method(
        &self,
        recv_name: Option<&str>,
        receiver: &RExpr,
        method: &str,
        args: Vec<Expr>,
    ) -> Expr {
        if let Some(name) = recv_name {
            if self.vars.contains(name) {
                return match (method, args.len()) {
                    ("get", 0) => Expr::Call("var-get".into(), vec![atom(name)]),
                    ("set", 1) => {
                        Expr::Call("var-set".into(), vec![atom(name), args.into_iter().next().unwrap()])
                    }
                    _ => Expr::Atom(format!(";; unsupported var op {method}")),
                };
            }
            if self.maps.contains(name) {
                let mut a = vec![atom(name)];
                a.extend(args);
                return match method {
                    "get" => Expr::Call("map-get?".into(), a),
                    "set" => Expr::Call("map-set".into(), a),
                    "insert" => Expr::Call("map-insert".into(), a),
                    "delete" => Expr::Call("map-delete".into(), a),
                    _ => Expr::Atom(format!(";; unsupported map op {method}")),
                };
            }
        }
        let recv = self.expr(receiver);
        match method {
            "unwrap_or" => Expr::Call("default-to".into(), vec![args.into_iter().next().unwrap(), recv]),
            "unwrap" => Expr::Call("unwrap-panic".into(), vec![recv]),
            "unwrap_err" => Expr::Call("unwrap-err-panic".into(), vec![recv]),
            "is_some" => Expr::Call("is-some".into(), vec![recv]),
            "is_none" => Expr::Call("is-none".into(), vec![recv]),
            "is_ok" => Expr::Call("is-ok".into(), vec![recv]),
            "is_err" => Expr::Call("is-err".into(), vec![recv]),
            other => {
                let mut a = vec![recv];
                a.extend(args);
                Expr::Call(kebab(other), a)
            }
        }
    }

    fn value_atom(&self, e: &RExpr, ty: &Type) -> Expr {
        if let RExpr::Lit(l) = e {
            if let Lit::Int(i) = &l.lit {
                return Expr::Atom(match ty {
                    Type::Int => i.base10_digits().to_string(),
                    _ => format!("u{}", i.base10_digits()),
                });
            }
        }
        self.expr(e)
    }
}

fn binop(op: &BinOp) -> Option<&'static str> {
    Some(match op {
        BinOp::Add(_) => "+",
        BinOp::Sub(_) => "-",
        BinOp::Mul(_) => "*",
        BinOp::Div(_) => "/",
        BinOp::Rem(_) => "mod",
        BinOp::Eq(_) => "is-eq",
        BinOp::Ne(_) => "ne",
        BinOp::Lt(_) => "<",
        BinOp::Le(_) => "<=",
        BinOp::Gt(_) => ">",
        BinOp::Ge(_) => ">=",
        BinOp::And(_) => "and",
        BinOp::Or(_) => "or",
        _ => return None,
    })
}

fn lower_params(inputs: &Punctuated<FnArg, syn::token::Comma>) -> Result<Vec<Param>, String> {
    let mut out = Vec::new();
    for arg in inputs {
        match arg {
            FnArg::Typed(pt) => out.push(Param {
                name: kebab(&pat_ident(&pt.pat)?),
                ty: lower_type(&pt.ty)?,
            }),
            FnArg::Receiver(_) => {} // &self is the contract instance, not a clarity param
        }
    }
    Ok(out)
}

fn lower_type(ty: &RType) -> Result<Type, String> {
    let RType::Path(tp) = ty else {
        return Err("unsupported type".into());
    };
    let seg = tp.path.segments.last().ok_or("empty type path")?;
    let name = seg.ident.to_string();
    let gens = generic_types(&seg.arguments);
    let consts = const_args(&seg.arguments);
    Ok(match name.as_str() {
        "u128" | "u64" | "u32" | "usize" => Type::Uint,
        "i128" | "i64" | "i32" | "isize" => Type::Int,
        "bool" => Type::Bool,
        "Principal" => Type::Principal,
        "String" => Type::StringAscii(256),
        "StringAscii" if consts.len() == 1 => Type::StringAscii(consts[0]),
        "StringUtf8" if consts.len() == 1 => Type::StringUtf8(consts[0]),
        "Buff" if consts.len() == 1 => Type::Buff(consts[0]),
        "Response" if gens.len() == 2 => {
            Type::Response(Box::new(lower_type(gens[0])?), Box::new(lower_type(gens[1])?))
        }
        "Optional" | "Option" if gens.len() == 1 => Type::Optional(Box::new(lower_type(gens[0])?)),
        other => Type::Other(other.to_lowercase()),
    })
}

fn generic_types(args: &PathArguments) -> Vec<&RType> {
    let mut out = Vec::new();
    if let PathArguments::AngleBracketed(ab) = args {
        for a in &ab.args {
            if let GenericArgument::Type(t) = a {
                out.push(t);
            }
        }
    }
    out
}

fn const_args(args: &PathArguments) -> Vec<u32> {
    let mut out = Vec::new();
    if let PathArguments::AngleBracketed(ab) = args {
        for a in &ab.args {
            if let GenericArgument::Const(RExpr::Lit(l)) = a {
                if let Lit::Int(i) = &l.lit {
                    if let Ok(n) = i.base10_digits().parse() {
                        out.push(n);
                    }
                }
            }
        }
    }
    out
}

fn lit_atom(lit: &Lit) -> String {
    match lit {
        Lit::Int(i) => match i.suffix() {
            "i128" | "i64" | "i32" | "isize" => i.base10_digits().to_string(),
            _ => format!("u{}", i.base10_digits()),
        },
        Lit::Bool(b) => b.value.to_string(),
        Lit::Str(s) => format!("\"{}\"", s.value()),
        _ => ";; unsupported literal".into(),
    }
}

fn fn_vis(attrs: &[syn::Attribute]) -> Option<Vis> {
    if has_attr(attrs, "public") {
        Some(Vis::Public)
    } else if has_attr(attrs, "readonly") {
        Some(Vis::ReadOnly)
    } else if has_attr(attrs, "private") {
        Some(Vis::Private)
    } else {
        None
    }
}

// the storage name a method is called on: a bare `name` (old shape) or `self.name`
// (real-rust shape). returns kebab-cased name, or None for value-method receivers.
fn receiver_field(recv: &RExpr) -> Option<String> {
    match recv {
        RExpr::Path(p) => p.path.get_ident().map(|i| kebab(&i.to_string())),
        RExpr::Field(f) => {
            if let RExpr::Path(base) = &*f.base {
                if base.path.is_ident("self") {
                    if let syn::Member::Named(n) = &f.member {
                        return Some(kebab(&n.to_string()));
                    }
                }
            }
            None
        }
        _ => None,
    }
}

// type constructor name -> the clarity literal prefix, so Uint(1) -> u1, Int(1) -> 1
fn type_ctor(name: &str) -> Option<&'static str> {
    match name {
        "Uint" => Some("u"),
        "Int" => Some(""),
        _ => None,
    }
}

// nullary helpers that map to a bare clarity keyword
fn keyword(name: &str) -> Option<&'static str> {
    match name {
        "tx_sender" => Some("tx-sender"),
        "block_height" => Some("block-height"),
        _ => None,
    }
}

fn path_name(expr: &RExpr) -> String {
    match expr {
        RExpr::Path(p) => p
            .path
            .segments
            .last()
            .map(|s| s.ident.to_string())
            .unwrap_or_default(),
        _ => String::new(),
    }
}

fn pat_ident(pat: &Pat) -> Result<String, String> {
    match pat {
        Pat::Ident(pi) => Ok(pi.ident.to_string()),
        _ => Err("only simple identifiers are supported in bindings".into()),
    }
}

fn uses_loop(stmts: &[RStmt]) -> bool {
    stmts.iter().any(|s| {
        matches!(
            s,
            RStmt::Expr(RExpr::While(_) | RExpr::ForLoop(_) | RExpr::Loop(_), _)
        )
    })
}

fn has_attr(attrs: &[syn::Attribute], name: &str) -> bool {
    attrs.iter().any(|a| a.path().is_ident(name))
}

fn atom(s: &str) -> Expr {
    Expr::Atom(s.to_string())
}

// pulls the original rust text back out of a node by span, for teaching comments
struct Src {
    text: String,
    line_starts: Vec<usize>,
}

impl Src {
    fn new(text: &str) -> Self {
        let mut line_starts = vec![0];
        for (i, b) in text.bytes().enumerate() {
            if b == b'\n' {
                line_starts.push(i + 1);
            }
        }
        Src {
            text: text.to_string(),
            line_starts,
        }
    }

    fn byte_off(&self, lc: LineColumn) -> usize {
        if lc.line == 0 || lc.line > self.line_starts.len() {
            return 0;
        }
        let line_start = self.line_starts[lc.line - 1];
        let mut off = line_start;
        let mut col = 0;
        for ch in self.text[line_start..].chars() {
            if col == lc.column {
                break;
            }
            off += ch.len_utf8();
            col += 1;
        }
        off
    }

    fn snippet<T: Spanned>(&self, node: &T) -> String {
        let span = node.span();
        let s = self.byte_off(span.start());
        let e = self.byte_off(span.end());
        if e <= s || e > self.text.len() {
            return String::new();
        }
        self.text[s..e].split_whitespace().collect::<Vec<_>>().join(" ")
    }

    fn prov<T: Spanned>(&self, node: &T) -> Prov {
        Prov {
            line: node.span().start().line,
            text: self.snippet(node),
        }
    }
}
