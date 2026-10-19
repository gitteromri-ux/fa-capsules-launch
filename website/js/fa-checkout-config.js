/* French Atelier — self-service checkout configuration.
 * Separate from the lead-gen forms (js/eteacher-leads.js is NOT touched).
 * Mirrors the proven Longevity engine: staged lead -> AddNewECommerceLeadAndOrder
 * -> GetECommerceFirstPaymentDetails -> Airwallex Drop-In (card / Apple Pay /
 * Google Pay) or PayPal -> SetECommercePayment. ProductID 25 is forced by the relay.
 *
 * ENVIRONMENT: production by default. ?env=staging (or github.io / localhost)
 * targets the eTeacher STAGING CRM + Airwallex demo — no real money.
 *
 * CRM COURSE IDENTITY: the FA course ids below MUST come from eTeacher
 * (MainAbroadCourseId / AbroadCourseId / PreferredCourseId / CampusId / LanguageId
 * for each French Atelier course and each Culture Capsule). Until they are set,
 * production checkout runs in "reserve" mode: it captures the enrollment as a
 * ProductID-25 lead through the proven leads relay (with the chosen product, plan
 * and amount in AdminNotes) and no card is charged. In staging the Longevity
 * staging placeholder is used ONLY to exercise the payment pipe (fake money).
 */
(function () {
  'use strict';
  var qs = new URLSearchParams(location.search);
  var host = location.hostname;
  var env = (qs.get('env') === 'staging' || /github\.io$|vercel\.app$|^localhost$|^127\./.test(host)) ? 'staging' : 'production';
  try {
    if (qs.get('env') === 'staging') sessionStorage.setItem('fa_ck_env', 'staging');
    else if (qs.get('env') === 'production') sessionStorage.removeItem('fa_ck_env');
    if (sessionStorage.getItem('fa_ck_env') === 'staging') env = 'staging';
  } catch (e) {}

  var STAGING_PIPE_PLACEHOLDER = { mainAbroadCourseId: 258, abroadCourseId: 1774, preferredCourseId: 168663, languageId: 101, isTrial: 0, placeholder: true };

  window.FA_ECOMM_CONFIG = {
    env: env,
    relayBase: 'https://fa-leads-proxy.vercel.app',
    leadsEndpoint: 'https://fa-leads-proxy.vercel.app/leads/production',
    productId: 25,
    currency: 'USD',
    brand: 'The French Atelier by Acadomia',
    advisorEmail: 'advisor@eTeacherGroup.com',
    paypalClientId: 'AXL1tqJTVoHQ2RltFz9SUVu8EM5ZTKDLCviVev-lOPQEEX1ScBii9d5MSo3_dxGjemVjTQJr7hpztwkQ', /* eTeacher PayPal (same merchant as the CRM's Airwallex) */
    metaPixelId: '', /* French Atelier has no Meta pixel on the site yet. Set the FA pixel id to enable fbq events; never the Longevity pixel. */
    checkoutPage: 'checkout.html',

    /* Course levels sold on the homepage / course pages. */
    levels: {
      foundation:   { name: 'FA Foundation',   cefr: 'A0 → A1.1',   route: 'Paris',                         page: 'courses/fa-foundation.html' },
      beginner:     { name: 'FA Beginner',     cefr: 'A1.1 → A1.2', route: 'Normandy to Paris',             page: 'courses/fa-beginner.html' },
      elementary:   { name: 'FA Elementary',   cefr: 'A1.2 → A2.1', route: 'Loire · Bordeaux · Basque',     page: 'courses/fa-elementary.html' },
      intermediate: { name: 'FA Intermediate', cefr: 'A2.1 → A2.2', route: 'Marseille · Chamonix · Alsace', page: 'courses/fa-intermediate.html' }
    },
    /* Course facts shown in the checkout (source: how-it-works.html, faq.html, course pages). */
    courseFacts: [
      ['Format', '20 live lessons · one class a week'],
      ['Lesson', '85 minutes · live from France'],
      ['Group', 'Small groups of 10–12 learners'],
      ['Class times', 'Sunday to Friday · matched to your timezone'],
      ['Certificate', 'CEFR-aligned certificate by Acadomia + $100 in credits'],
      ['Recordings', 'Every lesson recorded · on-demand in your dashboard']
    ],
    capsuleFacts: [
      ['Format', '10 live one-hour conferences · once a week'],
      ['Speaker', 'Bilingual signature speaker · 15–20 min Q&A'],
      ['Language', 'No French required'],
      ['Platform', 'Live on Zoom · 10 weeks, one conference a week']
    ],
    /* Promo codes shown in the top strip. Display-level pricing; the CRM price plan is the charge of record. */
    promos: {
      CAPSULE20: { pct: 20, applies: ['capsule-1', 'capsule-2', 'capsule-3'], label: '20% off any Culture Capsules package', days: 7 }
    },
    classTimes: ['Weekday evenings (my timezone)', 'Weekday mornings or midday', 'Weekend', 'Any — next available start'],
    phone: '+1-888-230-5110',

    /* Culture Capsules — three thematic packs, 10 live one-hour Zoom conferences each, once a week. */
    capsules: {
      'fashion-art':  { name: 'Fashion & Art',      tagline: 'French aesthetics',   status: 'Already started — join the pack now', start: 'In progress' },
      'gastronomy':   { name: 'Gastronomy & Wine',  tagline: 'Terroir on the plate', status: 'Enrolling now — starts November', start: 'November 2026' },
      'cinema-music': { name: 'Cinema & Music',     tagline: 'Screens and songs',    status: 'Enrolling now — starts November', start: 'November 2026' }
    },

    /* OFFERS. Amounts are the ONLY source of truth for what the page shows; the
       engine refuses to mount a payment form unless the CRM's AmountToCharge and
       number of payments match the chosen offer exactly. */
    products: {
      'fa-course': {
        kind: 'course',
        title: 'The French Atelier — 20 live lessons',
        offerLabel: 'Online enrollment · 41% off · $99 first month, then 4 × $189',
        listMonthly: 292, listTotal: 1460, numberOfPayments: 5,
        monthly: 189, firstPayment: 99, total: 855, pct: 41,
        includes: ['20 live lessons · 85 minutes each', 'Certified native French teachers, live from France', 'Small groups of 10–12 learners', 'Julien, your 24/7 AI French tutor', 'Lifetime access to lesson recordings', 'CEFR-aligned certificate by Acadomia + $100 in credits'],
        crmCourse: null
      },
      'capsule-1': {
        kind: 'capsules', packs: 1,
        title: '1 Culture Capsule',
        offerLabel: '3 monthly payments of $99',
        numberOfPayments: 3, monthly: 99, firstPayment: 99, total: 297, perCapsule: 99,
        includes: ['10 live one-hour conferences on Zoom', 'Bilingual signature speaker', '15–20 minutes of questions after each talk', 'No French required', 'Sold independently of the language courses'],
        crmCourse: null
      },
      'capsule-2': {
        kind: 'capsules', packs: 2,
        title: '2 Culture Capsules',
        offerLabel: '3 monthly payments of $178 · $89 per capsule',
        numberOfPayments: 3, monthly: 178, firstPayment: 178, total: 534, perCapsule: 89,
        includes: ['20 live one-hour conferences on Zoom', 'Bilingual signature speakers', 'Each capsule at $89 a month instead of $99', 'No French required', 'Sold independently of the language courses'],
        crmCourse: null
      },
      'capsule-3': {
        kind: 'capsules', packs: 3,
        title: 'All 3 Culture Capsules',
        offerLabel: '3 monthly payments of $189 · $63 per capsule',
        numberOfPayments: 3, monthly: 189, firstPayment: 189, total: 567, perCapsule: 63,
        includes: ['30 live one-hour conferences on Zoom', 'Fashion & Art · Gastronomy & Wine · Cinema & Music', 'Every capsule at $63 a month instead of $99', 'No French required', 'Sold independently of the language courses'],
        crmCourse: null
      },
      'membership-12': {
        kind: 'membership',
        title: 'Atelier Membership — 12 months',
        offerLabel: 'Best value · $99 a month for 12 months',
        numberOfPayments: 12, monthly: 99, firstPayment: 99, total: 1188,
        includes: ['1 French Atelier language course (one of our 4 levels)', 'All 3 Culture Capsules — 30 conferences', 'The Atelier Benefits hub: ~10% at partner French restaurants, 15% on famous macarons, travel-in-France perks', 'Julien, your 24/7 AI French tutor', 'Private community & cultural resources'],
        crmCourse: null
      }
    },

    stagingPipePlaceholder: STAGING_PIPE_PLACEHOLDER
  };
})();
