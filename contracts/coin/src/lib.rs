use clarust_lang::prelude::*;

#[contract]
pub struct Coin {
    coin: FungibleToken,
}

#[contract_impl]
impl Coin {
    #[public]
    pub fn mint(&self, amount: Uint, recipient: Principal) -> Response<bool, Uint> {
        ft_mint(self.coin, amount, recipient)
    }

    #[public]
    pub fn transfer(&self, amount: Uint, sender: Principal, recipient: Principal) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), Uint(1));
        ft_transfer(self.coin, amount, sender, recipient)
    }

    #[readonly]
    pub fn get_balance(&self, who: Principal) -> Response<Uint, Uint> {
        ok(ft_get_balance(self.coin, who))
    }
}
