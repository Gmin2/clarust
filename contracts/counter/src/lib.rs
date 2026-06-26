use clarust_lang::prelude::*;

#[contract]
pub struct Counter {
    count: DataVar<Uint>,
}

#[contract_impl]
impl Counter {
    #[public]
    pub fn increment(&self, step: Uint) -> Response<Uint, Uint> {
        let new_count = self.count.get() + step;
        self.count.set(new_count);
        ok(new_count)
    }

    #[public]
    pub fn decrement(&self, step: Uint) -> Response<Uint, Uint> {
        let current = self.count.get();
        if step > current {
            err(Uint(1))
        } else {
            self.count.set(current - step);
            ok(self.count.get())
        }
    }

    #[readonly]
    pub fn get_count(&self) -> Uint {
        self.count.get()
    }
}
