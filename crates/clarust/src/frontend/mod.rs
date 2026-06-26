pub mod rust;

use crate::ir::{Contract, Expr};

// a language layer is one thing: a parser that turns source into the clarust IR.
// everything downstream (clarity emission, teaching comments, diagnostics,
// verification) is the orchestrator's job. only the real-rust frontend ships today;
// the trait is the seam a new language would implement.
pub trait Frontend {
    fn name(&self) -> &str;
    fn parse(&self, source: &str) -> Result<Contract, String>;
}

pub fn select(_path: &str) -> Box<dyn Frontend> {
    Box::new(rust::RustFrontend)
}

// idiomatic rust identifiers become idiomatic clarity ones: PascalCase and
// snake_case fold to kebab-case, but SCREAMING_SNAKE constants stay uppercase
// (ERR_NOT_OWNER -> ERR-NOT-OWNER).
pub fn kebab(s: &str) -> String {
    let screaming = s.chars().any(|c| c.is_ascii_uppercase())
        && s.chars().all(|c| c.is_ascii_uppercase() || c == '_' || c.is_ascii_digit());
    if screaming {
        return s.replace('_', "-");
    }
    let mut out = String::new();
    for (i, c) in s.chars().enumerate() {
        if c == '_' {
            out.push('-');
        } else if c.is_ascii_uppercase() {
            if i != 0 && !out.ends_with('-') {
                out.push('-');
            }
            out.push(c.to_ascii_lowercase());
        } else {
            out.push(c);
        }
    }
    out
}

// maps friendly call names to clarity builtins
pub fn builtin_call(name: &str, args: Vec<Expr>) -> Expr {
    let mapped = match name {
        "ok" => "ok",
        "err" => "err",
        "some" => "some",
        "none" => return Expr::Atom("none".into()),
        "asserts" => "asserts!",
        "try" => "try!",
        "len" => "len",
        "ft_transfer" => "ft-transfer?",
        "ft_mint" => "ft-mint?",
        "ft_burn" => "ft-burn?",
        "ft_get_balance" => "ft-get-balance",
        "ft_get_supply" => "ft-get-supply",
        "nft_mint" => "nft-mint?",
        "nft_transfer" => "nft-transfer?",
        "nft_burn" => "nft-burn?",
        "nft_get_owner" => "nft-get-owner?",
        other => return Expr::Call(kebab(other), args),
    };
    Expr::Call(mapped.into(), args)
}
