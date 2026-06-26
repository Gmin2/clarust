use clarust_lang::prelude::*;

#[contract]
pub struct Gate;

#[contract_impl]
impl Gate {
    #[readonly]
    pub fn max_of(&self, a: Uint, b: Uint) -> Uint {
        if a > b { a } else { b }
    }

    #[readonly]
    pub fn min_of(&self, a: Uint, b: Uint) -> Uint {
        if a < b { a } else { b }
    }
}
