"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  total: number | null;
  status: string | null;
  created_at: string;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  /*
   * =========================================
   * LOAD ORDERS
   * =========================================
   */

  async function loadCustomers() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          delivery_city,
          total,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading customers:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to load customers."
        );
      }

      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error(
        "Customers loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  /*
   * =========================================
   * BUILD CUSTOMERS
   * =========================================
   */

  const customers = useMemo(() => {
    const customerMap = new Map<
      string,
      Customer
    >();

    orders.forEach((order) => {
      const email =
        order.customer_email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return;
      }

      const existing =
        customerMap.get(email);

      if (!existing) {
        customerMap.set(email, {
          name:
            order.customer_name ||
            "Customer",

          email,

          phone:
            order.customer_phone ||
            "No phone",

          address:
            order.delivery_address ||
            "No address",

          city:
            order.delivery_city ||
            "",

          totalOrders: 1,

          totalSpent:
            Number(order.total || 0),

          lastOrderDate:
            order.created_at,
        });
      } else {
        existing.totalOrders += 1;

        existing.totalSpent +=
          Number(order.total || 0);

        if (
          new Date(order.created_at) >
          new Date(existing.lastOrderDate)
        ) {
          existing.lastOrderDate =
            order.created_at;

          existing.name =
            order.customer_name ||
            existing.name;

          existing.phone =
            order.customer_phone ||
            existing.phone;

          existing.address =
            order.delivery_address ||
            existing.address;

          existing.city =
            order.delivery_city ||
            existing.city;
        }
      }
    });

    return Array.from(
      customerMap.values()
    ).sort(
      (a, b) =>
        new Date(b.lastOrderDate).getTime() -
        new Date(a.lastOrderDate).getTime()
    );
  }, [orders]);

  /*
   * =========================================
   * FILTER CUSTOMERS
   * =========================================
   */

  const filteredCustomers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          .toLowerCase()
          .includes(searchValue) ||
        customer.email
          .toLowerCase()
          .includes(searchValue) ||
        customer.phone
          .toLowerCase()
          .includes(searchValue) ||
        customer.city
          .toLowerCase()
          .includes(searchValue)
    );
  }, [customers, search]);

  /*
   * =========================================
   * STATISTICS
   * =========================================
   */

  const totalCustomers =
    customers.length;

  const totalCustomerOrders =
    customers.reduce(
      (sum, customer) =>
        sum + customer.totalOrders,
      0
    );

  const totalCustomerSpending =
    customers.reduce(
      (sum, customer) =>
        sum + customer.totalSpent,
      0
    );

  const averageOrderValue =
    totalCustomerOrders > 0
      ? totalCustomerSpending /
        totalCustomerOrders
      : 0;

  /*
   * =========================================
   * HELPERS
   * =========================================
   */

  function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading customers...
            </p>

          </div>

        </div>
      </main>
    );
  }

  /*
   * =========================================
   * PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <Link
              href="/admin"
              className="text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Customers
            </h1>

            <p className="mt-3 text-[#806e6e]">
              View your customers and their
              order history.
            </p>

          </div>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="rounded-full bg-[#e8a0ad] px-7 py-3.5 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            ↻ Refresh
          </button>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-[20px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">

            <p className="font-black">
              Something went wrong
            </p>

            <p className="mt-1 break-words font-medium">
              {errorMessage}
            </p>

          </div>
        )}

        {/* STATISTICS */}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* Customers */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Total Customers
              </p>

              <span className="text-3xl">
                👥
              </span>

            </div>

            <p className="mt-5 text-4xl font-black">
              {totalCustomers}
            </p>

          </div>

          {/* Orders */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Customer Orders
              </p>

              <span className="text-3xl">
                📦
              </span>

            </div>

            <p className="mt-5 text-4xl font-black">
              {totalCustomerOrders}
            </p>

          </div>

          {/* Spending */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Customer Spending
              </p>

              <span className="text-3xl">
                💰
              </span>

            </div>

            <p className="mt-5 text-2xl font-black text-[#c97888]">
              ₱
              {formatCurrency(
                totalCustomerSpending
              )}
            </p>

          </div>

          {/* Average */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Average Order
              </p>

              <span className="text-3xl">
                📊
              </span>

            </div>

            <p className="mt-5 text-2xl font-black text-[#c97888]">
              ₱
              {formatCurrency(
                averageOrderValue
              )}
            </p>

          </div>

        </div>

        {/* SEARCH */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

          <label
            htmlFor="customer-search"
            className="mb-2 block text-sm font-bold"
          >
            Search Customers
          </label>

          <input
            id="customer-search"
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email, phone, or city..."
            className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20"
          />

          <p className="mt-4 text-sm text-[#806e6e]">
            Showing{" "}
            <span className="font-black text-[#2d2424]">
              {filteredCustomers.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-[#2d2424]">
              {customers.length}
            </span>{" "}
            customers
          </p>

        </section>

        {/* CUSTOMERS */}

        {filteredCustomers.length === 0 ? (

          <div className="mt-8 rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            <div className="text-6xl">
              👥
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No customers found
            </h2>

            <p className="mt-2 text-sm text-[#806e6e]">
              Customers will appear here once
              they place an order.
            </p>

          </div>

        ) : (

          <div className="mt-8 overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full border-collapse">

                <thead>

                  <tr className="border-b border-[#ead8d1] text-left">

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Customer
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Contact
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Location
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Orders
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Spent
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Last Order
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCustomers.map(
                    (customer) => (

                      <tr
                        key={customer.email}
                        className="border-b border-[#ead8d1] transition hover:bg-[#fff3ef]"
                      >

                        {/* CUSTOMER */}

                        <td className="px-6 py-5">

                          <p className="font-black">
                            {customer.name}
                          </p>

                          <p className="mt-1 text-xs text-[#806e6e]">
                            {customer.email}
                          </p>

                        </td>

                        {/* CONTACT */}

                        <td className="px-6 py-5">

                          <p className="text-sm font-semibold text-[#806e6e]">
                            {customer.phone}
                          </p>

                        </td>

                        {/* LOCATION */}

                        <td className="px-6 py-5">

                          <p className="max-w-[220px] text-sm font-semibold text-[#806e6e]">
                            {customer.address}
                          </p>

                          {customer.city && (
                            <p className="mt-1 text-xs text-[#a58f8f]">
                              {customer.city}
                            </p>
                          )}

                        </td>

                        {/* ORDERS */}

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-[#e7efff] px-3 py-2 text-xs font-bold text-[#4c69a8]">
                            {customer.totalOrders}{" "}
                            {customer.totalOrders ===
                            1
                              ? "order"
                              : "orders"}
                          </span>

                        </td>

                        {/* SPENT */}

                        <td className="px-6 py-5">

                          <span className="font-black text-[#c97888]">
                            ₱
                            {formatCurrency(
                              customer.totalSpent
                            )}
                          </span>

                        </td>

                        {/* LAST ORDER */}

                        <td className="px-6 py-5 text-right">

                          <span className="text-xs font-semibold text-[#806e6e]">
                            {formatDate(
                              customer.lastOrderDate
                            )}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="lg:hidden">

              {filteredCustomers.map(
                (customer) => (

                  <div
                    key={customer.email}
                    className="border-b border-[#ead8d1] p-6 last:border-b-0"
                  >

                    <div className="flex items-start gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f9ebe2] text-2xl">
                        👤
                      </div>

                      <div className="min-w-0">

                        <h2 className="font-black">
                          {customer.name}
                        </h2>

                        <p className="mt-1 break-all text-xs text-[#806e6e]">
                          {customer.email}
                        </p>

                        <p className="mt-1 text-xs text-[#806e6e]">
                          {customer.phone}
                        </p>

                      </div>

                    </div>

                    <div className="mt-6">

                      <p className="text-xs text-[#a58f8f]">
                        Address
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#806e6e]">
                        {customer.address}
                      </p>

                      {customer.city && (
                        <p className="mt-1 text-xs text-[#a58f8f]">
                          {customer.city}
                        </p>
                      )}

                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-xs text-[#a58f8f]">
                          Orders
                        </p>

                        <p className="mt-1 font-black text-[#4c69a8]">
                          {customer.totalOrders}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-[#a58f8f]">
                          Total Spent
                        </p>

                        <p className="mt-1 font-black text-[#c97888]">
                          ₱
                          {formatCurrency(
                            customer.totalSpent
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-5">

                      <p className="text-xs text-[#a58f8f]">
                        Last Order
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#806e6e]">
                        {formatDate(
                          customer.lastOrderDate
                        )}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </main>
  );
}