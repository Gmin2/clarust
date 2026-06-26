use crate::ir::*;

pub struct Emitted {
    pub clarity: String,
    pub notes: Vec<String>,
    // for each output line (0-based), the source line it came from, if any. used to
    // translate clarinet diagnostics back to the source the developer wrote.
    pub src_map: Vec<Option<usize>>,
}

struct Builder {
    lines: Vec<(String, Option<usize>)>,
    label: String,
    annotate: bool,
}

impl Builder {
    fn line(&mut self, text: String, src: Option<usize>) {
        self.lines.push((text, src));
    }

    fn comment(&mut self, prov: &Option<Prov>, indent: &str) {
        if self.annotate {
            if let Some(p) = prov {
                if !p.text.is_empty() {
                    self.line(format!("{indent};; {}: {}", self.label, p.text), None);
                }
            }
        }
    }

    fn append(&mut self, suffix: &str) {
        if let Some(last) = self.lines.last_mut() {
            last.0.push_str(suffix);
        }
    }
}

pub fn emit(c: &Contract, label: &str, annotate: bool) -> Emitted {
    let mut decls: Vec<&Decl> = c.decls.iter().collect();
    decls.sort_by_key(|d| rank(d));

    let mut notes = vec![format!(
        "contract `{}` becomes one clarity contract; no separate compile-to-bytecode step, clarity source is the on-chain artifact",
        c.name
    )];

    let mut b = Builder {
        lines: Vec::new(),
        label: label.to_string(),
        annotate,
    };

    b.line(format!(";; generated from {label} by clarust, do not hand-edit"), None);
    b.line(format!(";; contract: {}", c.name), None);
    b.line(
        format!(";; each `;; {label}:` line is the source it was lowered from, read them to learn clarity"),
        None,
    );

    for d in &decls {
        b.line(String::new(), None);
        emit_decl(&mut b, d, &mut notes);
    }
    notes.push(
        "no unbounded loops or recursion appear, the frontend rejects them, so this fits clarity's decidable, always-terminating model".to_string(),
    );

    let clarity = b.lines.iter().map(|(t, _)| t.as_str()).collect::<Vec<_>>().join("\n") + "\n";
    let src_map = b.lines.iter().map(|(_, s)| *s).collect();
    Emitted { clarity, notes, src_map }
}

fn rank(d: &Decl) -> u8 {
    match d {
        Decl::ImplTrait { .. } => 0,
        Decl::Func { .. } => 2,
        _ => 1,
    }
}

fn line_of(src: &Option<Prov>) -> Option<usize> {
    src.as_ref().map(|p| p.line)
}

fn emit_decl(b: &mut Builder, d: &Decl, notes: &mut Vec<String>) {
    match d {
        Decl::ImplTrait { target, src } => {
            notes.push(format!(
                "impl-trait `{target}` promises this contract matches the trait's function signatures, clarinet enforces it"
            ));
            b.comment(src, "");
            b.line(format!("(impl-trait {target})"), line_of(src));
        }
        Decl::DataVar { name, ty, init, src } => {
            notes.push(format!(
                "state `{name}` -> (define-data-var {name} {} ...), contract storage",
                render_type(ty)
            ));
            b.comment(src, "");
            b.line(
                format!("(define-data-var {name} {} {})", render_type(ty), render_expr(init)),
                line_of(src),
            );
        }
        Decl::Map { name, key, val, src } => {
            notes.push(format!(
                "map `{name}` -> (define-map {name} {} {}), key/value storage",
                render_type(key),
                render_type(val)
            ));
            b.comment(src, "");
            b.line(
                format!("(define-map {name} {} {})", render_type(key), render_type(val)),
                line_of(src),
            );
        }
        Decl::Ft { name, src } => {
            notes.push(format!(
                "token `{name}` -> (define-fungible-token {name}), tracked by the runtime, no manual balance sheet"
            ));
            b.comment(src, "");
            b.line(format!("(define-fungible-token {name})"), line_of(src));
        }
        Decl::Nft { name, id_ty, src } => {
            notes.push(format!(
                "nft `{name}` -> (define-non-fungible-token {name} {}), each id is unique and owned",
                render_type(id_ty)
            ));
            b.comment(src, "");
            b.line(
                format!("(define-non-fungible-token {name} {})", render_type(id_ty)),
                line_of(src),
            );
        }
        Decl::Const { name, ty, value, src } => {
            notes.push(format!(
                "const `{name}` ({}) -> (define-constant {name} ...), a fixed value, conventional for error codes",
                render_type(ty)
            ));
            b.comment(src, "");
            b.line(format!("(define-constant {name} {})", render_expr(value)), line_of(src));
        }
        Decl::Func { name, vis, params, body, src } => {
            let define = match vis {
                Vis::Public => "define-public",
                Vis::ReadOnly => "define-read-only",
                Vis::Private => "define-private",
            };
            match vis {
                Vis::Public => notes.push(format!(
                    "public fn `{name}` -> (define-public ...), every public call must return a (response ok err)"
                )),
                Vis::ReadOnly => notes.push(format!(
                    "read-only fn `{name}` -> (define-read-only ...), cannot mutate state"
                )),
                Vis::Private => {}
            }
            let head = if params.is_empty() {
                format!("({name})")
            } else {
                let ps: Vec<String> = params
                    .iter()
                    .map(|p| format!("({} {})", p.name, render_type(&p.ty)))
                    .collect();
                format!("({name} {})", ps.join(" "))
            };
            b.comment(src, "");
            b.line(format!("({define} {head}"), line_of(src));
            lower_block(b, body, 1);
            b.append(")");
        }
    }
}

// emits a flat statement list as nested clarity, line by line, recording each
// statement's source line so diagnostics can point back at it
fn lower_block(b: &mut Builder, stmts: &[Stmt], depth: usize) {
    let ind = "  ".repeat(depth);
    if stmts.is_empty() {
        b.line(format!("{ind}true"), None);
        return;
    }
    match &stmts[0] {
        Stmt::Let { name, value, src } => {
            b.comment(src, &ind);
            b.line(format!("{ind}(let (({name} {}))", render_expr(value)), line_of(src));
            lower_block(b, &stmts[1..], depth + 1);
            b.append(")");
        }
        Stmt::Do { value, src } => {
            b.comment(src, &ind);
            if stmts.len() == 1 {
                b.line(format!("{ind}{}", render_expr(value)), line_of(src));
            } else {
                b.line(format!("{ind}(begin"), line_of(src));
                b.line(format!("{ind}  {}", render_expr(value)), line_of(src));
                lower_block(b, &stmts[1..], depth + 1);
                b.append(")");
            }
        }
    }
}

fn render_expr(e: &Expr) -> String {
    match e {
        Expr::Atom(s) => s.clone(),
        Expr::Call(name, args) => {
            if args.is_empty() {
                format!("({name})")
            } else {
                let a: Vec<String> = args.iter().map(render_expr).collect();
                format!("({name} {})", a.join(" "))
            }
        }
        Expr::If(c, t, e) => {
            format!("(if {} {} {})", render_expr(c), render_expr(t), render_expr(e))
        }
        Expr::Let(name, v, b) => {
            format!("(let (({name} {})) {})", render_expr(v), render_expr(b))
        }
        Expr::Begin(es) => {
            let a: Vec<String> = es.iter().map(render_expr).collect();
            format!("(begin {})", a.join(" "))
        }
    }
}

fn render_type(t: &Type) -> String {
    match t {
        Type::Uint => "uint".to_string(),
        Type::Int => "int".to_string(),
        Type::Bool => "bool".to_string(),
        Type::Principal => "principal".to_string(),
        Type::StringAscii(n) => format!("(string-ascii {n})"),
        Type::StringUtf8(n) => format!("(string-utf8 {n})"),
        Type::Buff(n) => format!("(buff {n})"),
        Type::Optional(t) => format!("(optional {})", render_type(t)),
        Type::Response(a, b) => format!("(response {} {})", render_type(a), render_type(b)),
        Type::Other(s) => s.clone(),
    }
}
