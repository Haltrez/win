'use client';
import { useState } from 'react';
import { SITE } from '@/lib/config';

const TOPICS = ['Data correction', 'Partnership', 'Press', 'Something else'];

/** Contact form that delivers to the owner's inbox via Web3Forms – no email address is shown on the site. */
export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  if (!SITE.contactFormKey) return <p className="muted">The contact form is being set up – please check back shortly.</p>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('botcheck')) return;
    setState('sending');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: SITE.contactFormKey,
          subject: `[${SITE.name}] ${f.get('topic')}: ${String(f.get('name') || '').slice(0, 60)}`,
          from_name: SITE.name,
          name: f.get('name'), email: f.get('email'), topic: f.get('topic'), message: f.get('message'),
          page: location.href,
        }),
      });
      const j = await r.json().catch(() => ({}));
      setState(r.ok && j.success !== false ? 'sent' : 'error');
    } catch { setState('error'); }
  }

  if (state === 'sent') return <p className="form-ok" role="status">Thanks – your message has been sent. We usually reply within 2 working days.</p>;
  return (
    <form className="contact-form" onSubmit={submit}>
      <label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label>
      <label>Your email<input name="email" type="email" required maxLength={120} autoComplete="email" /></label>
      <label>Topic<select name="topic" defaultValue={TOPICS[0]}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label>Message<textarea name="message" required minLength={10} maxLength={4000} rows={6} /></label>
      <input type="checkbox" name="botcheck" className="hp" tabIndex={-1} autoComplete="off" aria-hidden />
      <button className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}</button>
      {state === 'error' ? <p className="form-err" role="alert">Sorry, that didn&apos;t send. Please try again in a minute.</p> : null}
    </form>
  );
}
