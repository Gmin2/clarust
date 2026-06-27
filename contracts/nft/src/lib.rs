use clarust_lang::prelude::*;

#[contract]
pub struct Nft {
    asset: NonFungibleToken<Uint>,
}

#[contract_impl]
impl Nft {
    #[public]
    pub fn mint(&self, id: Uint, recipient: Principal) -> Response<bool, Uint> {
        nft_mint(self.asset, id, recipient)
    }

    #[public]
    pub fn transfer(&self, id: Uint, sender: Principal, recipient: Principal) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), Uint(1));
        nft_transfer(self.asset, id, sender, recipient)
    }

    #[readonly]
    pub fn owner_of(&self, id: Uint) -> Option<Principal> {
        nft_get_owner(self.asset, id)
    }
}
