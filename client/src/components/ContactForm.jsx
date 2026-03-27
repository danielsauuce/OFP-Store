import { useState, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'react-hot-toast';
import { contactSchema, validateForm } from '../validation/formSchemas';
import { createTicketService } from '../services/supportService';

gsap.registerPlugin(ScrollTrigger);

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
    fullWidth: true,
  },
];

const initialFormData = { name: '', email: '', subject: '', message: '' };

const ContactForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);

  const formRef = useRef(null);
  const buttonRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const shakeErrorFields = (validationErrors) => {
    if (!formRef.current) return;

    Object.keys(validationErrors).forEach((fieldName) => {
      const el = formRef.current.querySelector(`[name="${fieldName}"]`);

      if (el) {
        gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors: validationErrors } = validateForm(contactSchema, formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shakeErrorFields(validationErrors);
      return;
    }

    try {
      setIsSending(true);

      await createTicketService(formData);

      toast.success('Message sent successfully');

      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      const errorMessage = error?.message || 'Failed to send message. Please try again.';

      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  useLayoutEffect(() => {
    if (window.Cypress) return;
    const ctx = gsap.context(() => {
      gsap.from(formRef.current, {
        scrollTrigger: {
          trigger: formRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      const formFields = gsap.utils.toArray('.contact-field');

      gsap.from(formFields, {
        scrollTrigger: {
          trigger: formRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.2,
        ease: 'power2.out',
      });

      gsap.from(buttonRef.current, {
        scrollTrigger: {
          trigger: buttonRef.current,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: 'back.out(1.4)',
      });

      const hoverTL = gsap.timeline({ paused: true });

      hoverTL.to(buttonRef.current, {
        scale: 1.02,
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        duration: 0.3,
        ease: 'power2.out',
      });

      buttonRef.current?.addEventListener('mouseenter', () => hoverTL.play());
      buttonRef.current?.addEventListener('mouseleave', () => hoverTL.reverse());
    }, formRef);

    return () => ctx.revert();
  }, []);

  /* FIX: this was missing */
  const isFormFilled =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.subject.trim() &&
    formData.message.trim();

  return (
    <div ref={formRef} className="bg-card p-8 rounded-2xl shadow-card">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="grid md:grid-cols-2 gap-6">
          {fields.slice(0, 2).map((field) => {
            const hasError = !!errors[field.name];

            return (
              <div key={field.id} className="contact-field">
                <label htmlFor={field.id} className="block font-semibold mb-1 text-foreground">
                  {field.label}
                </label>

                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow ${
                    hasError
                      ? 'border-destructive focus:ring-destructive/40'
                      : 'border-border focus:ring-primary'
                  }`}
                />

                {hasError && (
                  <p className="text-sm text-destructive mt-1 pl-1">{errors[field.name]}</p>
                )}
              </div>
            );
          })}
        </div>

        {fields.slice(2).map((field) => {
          const hasError = !!errors[field.name];

          return (
            <div key={field.id} className="contact-field">
              <label htmlFor={field.id} className="block font-semibold mb-1 text-foreground">
                {field.label}
              </label>

              <input
                id={field.id}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow ${
                  hasError
                    ? 'border-destructive focus:ring-destructive/40'
                    : 'border-border focus:ring-primary'
                }`}
              />

              {hasError && (
                <p className="text-sm text-destructive mt-1 pl-1">{errors[field.name]}</p>
              )}
            </div>
          );
        })}

        <div className="contact-field">
          <label htmlFor="message" className="block font-semibold mb-1 text-foreground">
            Message *
          </label>

          <textarea
            id="message"
            name="message"
            rows={6}
            placeholder="Your message..."
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow resize-y ${
              errors.message
                ? 'border-destructive focus:ring-destructive/40'
                : 'border-border focus:ring-primary'
            }`}
          />

          {errors.message && <p className="text-sm text-destructive mt-1 pl-1">{errors.message}</p>}
        </div>

        <button
          ref={buttonRef}
          type="submit"
          disabled={isSending}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 ${
            !isSending
              ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
