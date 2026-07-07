import React, { useState } from 'react';
import { getApiError } from '../api/client';
import { createSubscription } from '../api/subscriptionApi';

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setSubmitted(true);

    if (!validEmail(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      setSaving(true);
      await createSubscription({
        email: email.trim(),
        source: 'newsletter_section',
      });
      setEmail('');
      setMessage('Subscribed successfully.');
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const hasError = submitted && message && !message.toLowerCase().includes('success');

  return (
    <section className="bg-pg-maroon px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-white shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-10">
        <h2 className="text-2xl font-extrabold tracking-tight">Subscribe to Our Newsletter</h2>
        <p className="mt-7 text-base font-medium leading-6 text-blue-100">
          Get the latest scholarship updates delivered to you. No spam, unsubscribe anytime.
        </p>

        <form onSubmit={handleSubmit} className="mt-7">
          <div className={`flex h-16 items-center rounded-xl border bg-white/10 px-4 ${hasError ? 'border-red-400' : 'border-white/25 focus-within:border-white/60'}`}>
            <span className="mr-3 text-2xl text-blue-100" aria-hidden="true">&#9993;</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (message && !message.toLowerCase().includes('success')) setMessage('');
              }}
              placeholder="Enter your email address"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-blue-200/70"
              aria-label="Email address"
            />
            
          </div>

          {message && (
            <p className={`mt-2 px-4 text-sm font-bold ${message.toLowerCase().includes('success') ? 'text-white' : 'text-red-100'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-7 flex h-16 w-full items-center justify-center rounded-xl bg-white px-6 text-lg font-extrabold text-pg-maroon shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Subscribing...' : 'Subscribe Now'}
            {/* <span className="ml-4 text-3xl leading-none" aria-hidden="true">&gt;</span> */}
          </button>
        </form>

        <p className="mx-auto mt-7 max-w-md text-center text-sm font-medium leading-6 text-blue-100">
          By subscribing, you agree to our <span className="font-extrabold text-white">Privacy Policy</span>. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
