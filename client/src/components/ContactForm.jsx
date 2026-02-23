import React from 'react';

const fields = [
  {
    id: 'name',
    name: 'name',
    label: 'Name *',
    placeholder: 'Your Name',
    type: 'text',
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email *',
    placeholder: 'you@example.com',
    type: 'email',
  },
  {
    id: 'subject',
    name: 'subject',
    label: 'Subject *',
    placeholder: 'Subject',
    type: 'text',
  },
];

const ContactForm = () => {
  return (
    <div className="bg-card p-8 rounded-lg shadow-card">
      <form className="space-y-6">
        {/* Grid Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          {fields.slice(0, 2).map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block font-semibold mb-1">
                {field.label}
              </label>

              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {/* Subject (Full Width) */}
        <div>
          {fields.slice(2).map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block font-semibold mb-1">
                {field.label}
              </label>

              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div>
          <label htmlFor="message" className="block font-semibold mb-1">
            Message *
          </label>

          <textarea
            id="message"
            name="message"
            rows={6}
            placeholder="Your message..."
            className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-light transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
