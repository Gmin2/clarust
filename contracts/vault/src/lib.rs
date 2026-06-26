use clarust_lang::prelude::*;

#[contract]
pub struct Vault {
    deposits: Map<Principal, Uint>,
}

#[contract_impl]
impl Vault {
    #[public]
    pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.deposits.get(who).unwrap_or(Uint(0));
        self.deposits.set(who, current + amount);
        ok(current + amount)
    }

    #[public]
    pub fn withdraw(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.deposits.get(who).unwrap_or(Uint(0));
        asserts(current >= amount, Uint(1));
        self.deposits.set(who, current - amount);
        ok(current - amount)
    }

    #[readonly]
    pub fn balance_of(&self, who: Principal) -> Uint {
        self.deposits.get(who).unwrap_or(Uint(0))
    }
}
