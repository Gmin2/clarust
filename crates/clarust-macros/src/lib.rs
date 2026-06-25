use proc_macro::TokenStream;

// these attributes exist so a contract is real, rustc-checked Rust with full
// editor support. at build time they pass the item through unchanged; the clarust
// transpiler reads the same source separately to produce clarity. the markers carry
// no codegen, they just label intent for a human reader and for the transpiler.

#[proc_macro_attribute]
pub fn contract(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn contract_impl(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn public(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn readonly(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn private(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn impl_trait(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}
