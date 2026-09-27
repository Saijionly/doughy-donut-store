"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
};

type Order = {
  id: number;
  customer_name: string | null;
  total: number | null;
  status: string | null;
  created_at: string;
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = Number(params.id);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function loadCustomer() {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!customerId || Number.isNaN(customerId)) {
        throw new Error("Invalid customer ID.");
      }

      /*
       * =========================================
       * LOAD CUSTOMER
       * =========================================
       */

      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(`
          id,
          name,
          email,
          phone,
          address,
          city,
          created_at
        `)
        .eq("id", customerId)
        .single();

      if (customerError) {
        console.error(
          "Customer loading error:",
          customerError
        );

        throw new Error(
          customerError.message ||
            "Unable to load customer."
        );
      }

      /*
       * =========================================
       * LOAD CUSTOMER ORDERS
       * =========================================
       */

      const {
        data: ordersData,
        error: ordersError,
      } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          total,
          status,
          created_at
        `)
        .eq("customer_email", customerData.email)
        .order("created_at", {
          ascending: false,
        });

      if (ordersError) {
        console.error(
          "Customer orders loading error:",
          ordersError
        );

        throw new Error(
          ordersError.message ||
            "Unable to load customer orders."
        );
      }

      setCustomer(
        customerData as Customer
      );

      setOrders(
        (ordersData as Order[]) || []
      );
    } catch (error) {
      console.error(
        "Customer loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load customer."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  /*
   * =========================================
   * STATISTICS
   * =========================================
   */

  const totalSpent = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  );

  const completedOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() ===
      "completed"
  ).length;

  /*
   * =========================================
   * HELPERS
   * =========================================
   */

  function formatStatus(
    status: string | null
  ) {
    if (!status) {
      return "Pending";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase()
    );
  }

  function getStatusClasses(
    status: string | null
  ) {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-[#fff1d8] text-[#a66a00]";

      case "processing":
        return "bg-[#e7efff] text-[#4c69a8]";

      case "completed":
        return "bg-[#e4f6e9] text-[#4f8a61]";

      case "cancelled":
        return "bg-[#fce4e7] text-[#a84f61]";

      default:
        return "bg-[#f9ebe2] text-[#806e6e]";
    }
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

  function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="text-center">

            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 font-bold text-[#806e6e]">
              Loading customer...
            </p>

          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * CUSTOMER NOT FOUND
   * =========================================
   */

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-3xl">

          <Link
            href="/admin/customers"
            className="font-bold text-[#c97888]"
          >
            ← Back to Customers
          </Link>

          <div className="mt-8 rounded-[30px] bg-[#fff8f5] p-10 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            <div className="text-6xl">
              👤
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Customer Not Found
            </h1>

            <p className="mt-3 text-[#806e6e]">
              {errorMessage ||
                "This customer does not exist."}
            </p>

            <Link
              href="/admin/customers"
              className="mt-7 inline-block rounded-full bg-[#e8a0ad] px-7 py-3.5 font-bold text-white transition hover:bg-[#d88a9a]"
            >
              Back to Customers
            </Link>

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
      <div className="mx-auto max-w-6xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <Link
              href="/admin/customers"
              className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              ← Back to Customers
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              {customer.name ||
                "Customer"}
            </h1>

            <p className="mt-3 text-[#806e6e]">
              Customer since{" "}
              {formatDate(
                customer.created_at
              )}
            </p>

          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#fff8f5] text-4xl shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            👤
          </div>

        </div>

        {/* =====================================
            ERROR
        ====================================== */}

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

        {/* =====================================
            STATISTICS
        ====================================== */}

        <div className="mt-10 grid gap-5 sm:grid-cols-3">

          {/* Orders */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Total Orders
              </p>

              <span className="text-2xl">
                📦
              </span>

            </div>

            <p className="mt-4 text-4xl font-black">
              {orders.length}
            </p>

          </div>

          {/* Completed */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Completed
              </p>

              <span className="text-2xl">
                ✅
              </span>

            </div>

            <p className="mt-4 text-4xl font-black text-[#4f8a61]">
              {completedOrders}
            </p>

          </div>

          {/* Total Spent */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Total Spent
              </p>

              <span className="text-2xl">
                💰
              </span>

            </div>

            <p className="mt-4 text-2xl font-black text-[#c97888]">
              ₱{formatCurrency(totalSpent)}
            </p>

          </div>

        </div>

        {/* =====================================
            CUSTOMER INFORMATION
        ====================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a58f8f]">
            Profile
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Customer Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Name */}

            <div className="rounded-[22px] bg-[#f9ebe2] p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Full Name
              </p>

              <p className="mt-2 font-black">
                {customer.name || "—"}
              </p>

            </div>

            {/* Email */}

            <div className="rounded-[22px] bg-[#f9ebe2] p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Email
              </p>

              <p className="mt-2 break-all font-bold">
                {customer.email || "—"}
              </p>

            </div>

            {/* Phone */}

            <div className="rounded-[22px] bg-[#f9ebe2] p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Phone
              </p>

              <p className="mt-2 font-black">
                {customer.phone || "—"}
              </p>

            </div>

            {/* Address */}

            <div className="rounded-[22px] bg-[#f9ebe2] p-5 sm:col-span-2">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Address
              </p>

              <p className="mt-2 font-bold leading-6">
                {customer.address || "—"}

                {customer.city
                  ? `, ${customer.city}`
                  : ""}
              </p>

            </div>

            {/* Customer ID */}

            <div className="rounded-[22px] bg-[#f9ebe2] p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Customer ID
              </p>

              <p className="mt-2 font-black text-[#c97888]">
                #{customer.id}
              </p>

            </div>

          </div>
        </section>

        {/* =====================================
            ORDER HISTORY
        ====================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a58f8f]">
                Activity
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Order History
              </h2>

            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              View All Orders →
            </Link>

          </div>

          {orders.length === 0 ? (

            <div className="mt-6 rounded-[22px] bg-[#f9ebe2] p-10 text-center">

              <div className="text-5xl">
                📦
              </div>

              <p className="mt-4 font-bold text-[#806e6e]">
                No orders found for this customer.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {orders.map(
                (order) => (

                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block rounded-[24px] bg-[#f9ebe2] p-5 transition hover:-translate-y-0.5 hover:bg-[#f5e3dc]"
                  >

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                      {/* Order */}

                      <div>

                        <p className="text-xs font-bold uppercase tracking-wider text-[#c97888]">
                          Order
                        </p>

                        <p className="mt-1 text-xl font-black">
                          #{order.id}
                        </p>

                        <p className="mt-1 text-xs text-[#806e6e]">
                          {formatDate(
                            order.created_at
                          )}
                        </p>

                      </div>

                      {/* Status */}

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${getStatusClasses(
                          order.status
                        )}`}
                      >
                        {formatStatus(
                          order.status
                        )}
                      </span>

                      {/* Total */}

                      <div className="sm:text-right">

                        <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-black text-[#c97888]">
                          ₱
                          {formatCurrency(
                            Number(
                              order.total ||
                                0
                            )
                          )}
                        </p>

                      </div>

                    </div>

                  </Link>

                )
              )}

            </div>

          )}

        </section>

        {/* =====================================
            BACK BUTTON
        ====================================== */}

        <div className="mt-8 pb-10">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/customers"
              )
            }
            className="rounded-full bg-[#e8a0ad] px-7 py-3.5 font-bold text-white transition hover:bg-[#d88a9a]"
          >
            ← Back to Customers
          </button>

        </div>

      </div>
    </main>
  );
}