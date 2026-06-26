use clarust_lang::prelude::*;

#[contract]
pub struct Ledger {
    balances: Map<Principal, Uint>,
}

#[contract_impl]
impl Ledger {
    #[public]
    pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.balances.get(who).unwrap_or(Uint(0));
        self.balances.set(who, current + amount);
        ok(current + amount)
    }

    #[readonly]
    pub fn balance_of(&self, who: Principal) -> Uint {
        self.balances.get(who).unwrap_or(Uint(0))
    }
}
