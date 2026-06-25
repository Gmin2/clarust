//! real rust types that mirror clarity's model, so a contract written against this
//! crate compiles under rustc and gets full editor support. the clarust transpiler
//! reads the same source and emits clarity; these types are the spec the developer
//! writes against, they are not meant to execute on chain.

pub mod prelude {
    pub use crate::{
        asserts, err, ft_get_balance, ft_get_supply, ft_mint, ft_transfer, nft_get_owner, nft_mint,
        nft_transfer, none, ok, some, tx_sender, Buff, DataVar, FungibleToken, Map,
        NonFungibleToken, Principal, Response, StringAscii, StringUtf8, Uint,
    };
    pub use clarust_macros::{contract, contract_impl, impl_trait, private, public, readonly};
}

use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::{Add, Div, Mul, Rem, Sub};

// clarity uint is a 128-bit unsigned integer. a newtype lets the transpiler tell
// uint from int, and gives real arithmetic for type-checking.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug, Default, Hash)]
pub struct Uint(pub u128);

impl From<u128> for Uint {
    fn from(v: u128) -> Self {
        Uint(v)
    }
}

macro_rules! uint_op {
    ($trait:ident, $method:ident, $op:tt) => {
        impl $trait for Uint {
            type Output = Uint;
            fn $method(self, rhs: Uint) -> Uint {
                Uint(self.0 $op rhs.0)
            }
        }
    };
}
uint_op!(Add, add, +);
uint_op!(Sub, sub, -);
uint_op!(Mul, mul, *);
uint_op!(Div, div, /);
uint_op!(Rem, rem, %);

// a clarity principal (an address). opaque and Copy so contracts can pass it around
// without borrow noise. it never carries a real value, the transpiler handles it.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Default, Debug)]
pub struct Principal;

// clarity strings are sized, but the size only matters where it is emitted (params).
// for return values the literal drives the type and clarity's subtyping satisfies
// the trait, so these stay simple string slices.
pub type StringAscii = &'static str;
pub type StringUtf8 = &'static str;

// a sized byte buffer, e.g. Buff<34> -> (buff 34). the const param is read by the
// transpiler; the value itself never executes.
pub struct Buff<const N: usize>;

// the current caller, clarity's tx-sender
pub fn tx_sender() -> Principal {
    Principal
}

// a contract-level data variable. get/set mirror var-get/var-set.
pub struct DataVar<T> {
    value: RefCell<T>,
}

impl<T: Clone + Default> Default for DataVar<T> {
    fn default() -> Self {
        DataVar {
            value: RefCell::new(T::default()),
        }
    }
}

impl<T: Clone> DataVar<T> {
    pub fn get(&self) -> T {
        self.value.borrow().clone()
    }

    pub fn set(&self, v: T) {
        *self.value.borrow_mut() = v;
    }
}

// a clarity map. get returns an Option, matching map-get?.
pub struct Map<K, V> {
    inner: RefCell<HashMap<K, V>>,
}

impl<K, V> Default for Map<K, V> {
    fn default() -> Self {
        Map {
            inner: RefCell::new(HashMap::new()),
        }
    }
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> Map<K, V> {
    pub fn get(&self, key: K) -> Option<V> {
        self.inner.borrow().get(&key).cloned()
    }

    pub fn set(&self, key: K, value: V) {
        self.inner.borrow_mut().insert(key, value);
    }

    pub fn insert(&self, key: K, value: V) {
        self.inner.borrow_mut().insert(key, value);
    }

    pub fn delete(&self, key: K) {
        self.inner.borrow_mut().remove(&key);
    }
}

#[derive(Clone, Copy, Default)]
pub struct FungibleToken;

#[derive(Clone, Copy, Default)]
pub struct NonFungibleToken<Id> {
    _id: std::marker::PhantomData<Id>,
}

// clarity Response<ok, err>. public functions must return one of these.
pub enum Response<T, E> {
    Ok(T),
    Err(E),
}

pub fn ok<T, E>(v: T) -> Response<T, E> {
    Response::Ok(v)
}

pub fn err<T, E>(e: E) -> Response<T, E> {
    Response::Err(e)
}

pub fn some<T>(v: T) -> Option<T> {
    Some(v)
}

pub fn none<T>() -> Option<T> {
    None
}

// a guard: aborts the whole transaction with the given error code when the
// condition is false. mirrors (asserts! cond (err code)).
pub fn asserts(_cond: bool, _err_code: Uint) {}

// fungible token operations
pub fn ft_transfer(
    _token: FungibleToken,
    _amount: Uint,
    _sender: Principal,
    _recipient: Principal,
) -> Response<bool, Uint> {
    Response::Ok(true)
}

pub fn ft_mint(_token: FungibleToken, _amount: Uint, _recipient: Principal) -> Response<bool, Uint> {
    Response::Ok(true)
}

pub fn ft_get_balance(_token: FungibleToken, _who: Principal) -> Uint {
    Uint(0)
}

pub fn ft_get_supply(_token: FungibleToken) -> Uint {
    Uint(0)
}

// non-fungible token operations
pub fn nft_mint<Id>(
    _token: NonFungibleToken<Id>,
    _id: Id,
    _recipient: Principal,
) -> Response<bool, Uint> {
    Response::Ok(true)
}

pub fn nft_transfer<Id>(
    _token: NonFungibleToken<Id>,
    _id: Id,
    _sender: Principal,
    _recipient: Principal,
) -> Response<bool, Uint> {
    Response::Ok(true)
}

pub fn nft_get_owner<Id>(_token: NonFungibleToken<Id>, _id: Id) -> Option<Principal> {
    None
}
