import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button, Field, Input, Textarea } from '@/components/kit';
import { SectionHeading } from '@/components/MarketingBits';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    toast.success('Message received', { description: 'We will get back to you shortly.' });
  };
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 lg:px-8">
      <SectionHeading eyebrow="Contact" title="Talk to us" description="Questions about the platform, partnerships, or press? Send a note or email hello@carrionnetworks.com." />
      <form onSubmit={submit} className="mt-10 space-y-5">
        <Field label="Name" htmlFor="c-name"><Input id="c-name" required disabled={sent} /></Field>
        <Field label="Email" htmlFor="c-email"><Input id="c-email" type="email" required disabled={sent} /></Field>
        <Field label="Message" htmlFor="c-msg"><Textarea id="c-msg" required disabled={sent} /></Field>
        <Button type="submit" disabled={sent}>{sent ? 'Message sent' : 'Send message'}</Button>
      </form>
    </div>
  );
}
