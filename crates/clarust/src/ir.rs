// the clarust IR: a clarity-shaped intermediate representation. every language
// frontend lowers its source into this, and the orchestrator turns this into
// clarity. it is the contract between the two, keep it free of any source-language
// concepts.

pub enum Type {
    Uint,
    Int,
    Bool,
    Principal,
    StringAscii(u32),
    StringUtf8(u32),
    Buff(u32),
    Optional(Box<Type>),
    Response(Box<Type>, Box<Type>),
    Other(String),
}

pub enum Vis {
    Public,
    ReadOnly,
    Private,
}

// where a form came from in the source: a 1-based line and the snippet text. the
// orchestrator uses text for teaching comments and line for diagnostic remapping.
pub struct Prov {
    pub line: usize,
    pub text: String,
}

pub struct Param {
    pub name: String,
    pub ty: Type,
}

// expressions are already resolved to clarity names. a frontend that knows
// `count.get()` is a data-var read emits Call("var-get", [Atom("count")]).
pub enum Expr {
    Atom(String),
    Call(String, Vec<Expr>),
    If(Box<Expr>, Box<Expr>, Box<Expr>),
    Let(String, Box<Expr>, Box<Expr>),
    Begin(Vec<Expr>),
}

// a statement carries the original source text (src) so the orchestrator can quote
// it as a teaching comment without knowing which language it came from.
pub enum Stmt {
    Let {
        name: String,
        value: Expr,
        src: Option<Prov>,
    },
    Do {
        value: Expr,
        src: Option<Prov>,
    },
}

pub enum Decl {
    ImplTrait {
        target: String,
        src: Option<Prov>,
    },
    DataVar {
        name: String,
        ty: Type,
        init: Expr,
        src: Option<Prov>,
    },
    Map {
        name: String,
        key: Type,
        val: Type,
        src: Option<Prov>,
    },
    Ft {
        name: String,
        src: Option<Prov>,
    },
    Nft {
        name: String,
        id_ty: Type,
        src: Option<Prov>,
    },
    Const {
        name: String,
        ty: Type,
        value: Expr,
        src: Option<Prov>,
    },
    Func {
        name: String,
        vis: Vis,
        params: Vec<Param>,
        body: Vec<Stmt>,
        src: Option<Prov>,
    },
}

pub struct Contract {
    pub name: String,
    pub decls: Vec<Decl>,
}
