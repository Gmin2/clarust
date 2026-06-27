use clarust_lang::prelude::*;

const ERR_NOT_OWNER: Uint = Uint(100);

#[contract]
#[impl_trait(".sip-010-trait.sip-010-trait")]
pub struct Token {
    clarity_coin: FungibleToken,
}

#[contract_impl]
impl Token {
    #[public]
    #[allow(unused_variables)] // memo is required by the trait signature, unused here
    pub fn transfer(
        &self,
        amount: Uint,
        sender: Principal,
        recipient: Principal,
        memo: Option<Buff<34>>,
    ) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), ERR_NOT_OWNER);
        ft_transfer(self.clarity_coin, amount, sender, recipient)
    }

    #[public]
    pub fn mint(&self, amount: Uint, recipient: Principal) -> Response<bool, Uint> {
        ft_mint(self.clarity_coin, amount, recipient)
    }

    #[readonly]
    pub fn get_name(&self) -> Response<StringAscii, Uint> {
        ok("Clarity Coin")
    }

    #[readonly]
    pub fn get_symbol(&self) -> Response<StringAscii, Uint> {
        ok("CC")
    }

    #[readonly]
    pub fn get_decimals(&self) -> Response<Uint, Uint> {
        ok(Uint(6))
    }

    #[readonly]
    pub fn get_balance(&self, who: Principal) -> Response<Uint, Uint> {
        ok(ft_get_balance(self.clarity_coin, who))
    }

    #[readonly]
    pub fn get_total_supply(&self) -> Response<Uint, Uint> {
        ok(ft_get_supply(self.clarity_coin))
    }

    #[readonly]
    pub fn get_token_uri(&self) -> Response<Option<StringUtf8>, Uint> {
        ok(none())
    }
}
