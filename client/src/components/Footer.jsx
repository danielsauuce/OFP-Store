import { useLayoutEffect, useRef } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const quickLinks = [
  { label: 'Shop', path: '/shop' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Shopping Cart', path: '/cart' },
];

const customerServiceLinks = [
  'Shipping & Delivery',
  'Returns & Exchange',
  'Warranty Information',
  'FAQ',
];

const socialLinks = [
  { icon: Facebook, href: '#' },
  { icon: Instagram, href: '#' },
  { icon: Twitter, href: '#' },
];

const contactInfo = [
  { icon: Phone, text: '+234 (0) 123 456 7890' },
  { icon: Mail, text: 'info@olayinkafurniture.com' },
  {
    icon: MapPin,
    text: '1, Aroworamimo Street, Igbo-olomu, Agric Ikorodu, Lagos State, Nigeria.',
    isStart: true,
  },
];

function Footer() {
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Footer columns stagger up on scroll
      const columns = gsap.utils.toArray('.footer-col');
      gsap.from(columns, {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // Bottom bar fade in
      gsap.from('.footer-bottom', {
        scrollTrigger: {
          trigger: '.footer-bottom',
          start: 'top 97%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 15,
        duration: 0.6,
        ease: 'power2.out',
      });

      // Social icon hover effects
      const socialIcons = gsap.utils.toArray('.footer-social');
      socialIcons.forEach((icon) => {
        const hoverTL = gsap.timeline({ paused: true });
        hoverTL.to(icon, {
          y: -4,
          scale: 1.2,
          duration: 0.25,
          ease: 'power2.out',
        });
        icon.addEventListener('mouseenter', () => hoverTL.play());
        icon.addEventListener('mouseleave', () => hoverTL.reverse());
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Social */}
          <div className="footer-col space-y-4">
            <h3 className="font-serif font-bold text-lg text-foreground">
              Olayinka Furniture Palace
            </h3>
            <p className="text-sm text-muted-foreground">
              Crafting beautiful, timeless furniture for your home since 1995.
            </p>

            <div className="flex space-x-4">
              {socialLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <a
                    key={index}
                    href={link.href}
                    className="footer-social text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-col space-y-4">
            <h4 className="font-semibold text-foreground">Customer Service</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {customerServiceLinks.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col space-y-4">
            <h4 className="font-semibold text-foreground">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={index}
                    className={`flex gap-2 text-muted-foreground ${
                      item.isStart ? 'items-start' : 'items-center'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${item.isStart ? 'mt-0.5' : ''}`} />
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Olayinka Furniture Palace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
