import type { Lead, OutreachScript, LeadsArtifact, OutreachArtifact } from '@/types/database';

// Dummy leads for testing the CRM flow
export const DUMMY_LEADS: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'TechFlow Solutions',
    industry: 'SaaS',
    website: 'https://techflow.io',
    contactName: 'Sarah Chen',
    contactEmail: 'sarah@techflow.io',
    contactLinkedIn: 'https://linkedin.com/in/sarahchen',
    painPoints: ['Manual data entry', 'Slow customer response times'],
    score: 9,
    status: 'new'
  },
  {
    id: 'lead-2',
    companyName: 'GrowthLabs Agency',
    industry: 'Marketing',
    website: 'https://growthlabs.co',
    contactName: 'Mike Rodriguez',
    contactEmail: 'mike@growthlabs.co',
    contactLinkedIn: 'https://linkedin.com/in/mikerodriguez',
    painPoints: ['Lead qualification bottleneck', 'Inconsistent outreach'],
    score: 8,
    status: 'contacted'
  },
  {
    id: 'lead-3',
    companyName: 'Riverside Dental',
    industry: 'Healthcare',
    website: 'https://riversidedental.com',
    contactName: 'Dr. Emily Watson',
    contactEmail: 'emily@riversidedental.com',
    painPoints: ['Appointment no-shows', 'Patient follow-up'],
    score: 7,
    status: 'responded'
  },
  {
    id: 'lead-4',
    companyName: 'Urban Eats Restaurant',
    industry: 'Food & Beverage',
    website: 'https://urbaneats.com',
    contactName: 'James Park',
    contactEmail: 'james@urbaneats.com',
    painPoints: ['Online ordering complexity', 'Customer retention'],
    score: 6,
    status: 'new'
  },
  {
    id: 'lead-5',
    companyName: 'Summit Real Estate',
    industry: 'Real Estate',
    website: 'https://summitrealestate.com',
    contactName: 'Lisa Thompson',
    contactEmail: 'lisa@summitrealestate.com',
    contactLinkedIn: 'https://linkedin.com/in/lisathompson',
    painPoints: ['Lead response time', 'Property matching'],
    score: 8,
    status: 'converted'
  }
];

// Dummy outreach scripts for each lead
export const DUMMY_OUTREACH_SCRIPTS: OutreachScript[] = [
  {
    leadId: 'lead-1',
    leadName: 'TechFlow Solutions',
    emailScript: {
      subject: 'Quick question about automating data entry at TechFlow',
      body: `Hi Sarah,

I noticed TechFlow Solutions is growing rapidly in the SaaS space - congrats on the momentum!

I work with companies like yours to eliminate manual data entry and speed up customer response times. We've helped similar SaaS companies save 20+ hours per week on repetitive tasks.

Would you be open to a quick 15-minute call to see if automation could help TechFlow? I have some ideas specific to your industry.

Best,
[Your Name]`,
      followUp1: `Hi Sarah,

Just following up on my previous email. I know you're busy scaling TechFlow, but I wanted to share that we recently helped a SaaS company similar to yours reduce their data entry time by 80%.

Would a brief call this week work to explore if we could do the same for you?

Best,
[Your Name]`,
      followUp2: `Hi Sarah,

Last note from me - I don't want to be a pest! If automating manual processes isn't a priority right now, I completely understand.

But if you'd ever like to chat about how other SaaS companies are handling data entry and customer response automation, I'm always happy to share insights.

Best,
[Your Name]`
    },
    callScript: {
      opener: "Hi Sarah, this is [Your Name] from [Your Company]. I noticed TechFlow is doing some exciting things in the SaaS space. Do you have a quick moment?",
      valueProposition: "I help SaaS companies like TechFlow eliminate manual data entry and speed up customer response times. We've helped similar companies save 20+ hours per week.",
      questions: [
        "How is your team currently handling data entry tasks?",
        "What's your average response time to customer inquiries?",
        "Have you explored automation solutions before?",
        "If you could wave a magic wand, what repetitive task would you eliminate first?"
      ],
      objectionHandlers: {
        "We don't have budget": "I understand. Most of our clients actually see ROI within 30 days - the time savings alone pay for the investment. Could I show you a quick ROI calculator?",
        "We're too busy right now": "That's exactly why automation makes sense - it frees up your team's time. What if we scheduled a brief call next week when things calm down?",
        "We already have a solution": "Great! What's working well with your current setup? And where do you see room for improvement?",
        "I need to think about it": "Absolutely, it's an important decision. What specific aspects would you like to think through? I'm happy to provide more details."
      },
      closeAttempt: "Based on what you've shared, it sounds like TechFlow could benefit from our automation solutions. Would you be open to a 30-minute demo next week to see exactly how it would work for your team?"
    }
  },
  {
    leadId: 'lead-2',
    leadName: 'GrowthLabs Agency',
    emailScript: {
      subject: 'Solving lead qualification bottlenecks for agencies like GrowthLabs',
      body: `Hi Mike,

I came across GrowthLabs Agency and was impressed by your client portfolio. Marketing agencies often face the same challenge - qualifying leads quickly while maintaining consistent outreach.

We've helped agencies like yours streamline lead qualification by 60% and maintain 100% outreach consistency, even during busy seasons.

Would you be interested in a quick call to see how we might help GrowthLabs scale without adding headcount?

Best,
[Your Name]`,
      followUp1: `Hi Mike,

Quick follow-up - I wanted to share that we just helped another marketing agency increase their qualified lead conversion by 40% using automated qualification workflows.

If inconsistent outreach or lead qualification bottlenecks are challenges you're facing, I'd love to share how they did it.

15 minutes this week?

Best,
[Your Name]`,
      followUp2: `Hi Mike,

I'll keep this brief - if lead qualification and outreach consistency aren't priorities right now, no worries at all.

But if you're ever curious how other agencies are solving these challenges, my calendar is always open for a quick chat.

Best,
[Your Name]`
    },
    callScript: {
      opener: "Hi Mike, this is [Your Name]. I work with marketing agencies to solve lead qualification bottlenecks. Got a quick moment?",
      valueProposition: "We help agencies like GrowthLabs streamline lead qualification and maintain consistent outreach. Our clients typically see 60% faster qualification and 40% higher conversion rates.",
      questions: [
        "How are you currently qualifying inbound leads?",
        "What does your outreach process look like today?",
        "How many leads fall through the cracks during busy periods?",
        "What would perfect lead qualification look like for GrowthLabs?"
      ],
      objectionHandlers: {
        "We don't have budget": "I hear you. The good news is our solution typically pays for itself in the first month through improved close rates. Want to see the numbers?",
        "We're too busy right now": "That's actually why this might be perfect timing - we help agencies handle more leads without adding team members.",
        "We already have a solution": "Nice! What's working well? And where do you see the biggest gaps in your current process?",
        "I need to think about it": "Of course. What's the main thing you'd want to validate before moving forward?"
      },
      closeAttempt: "It sounds like GrowthLabs could really benefit from streamlined qualification. How about we set up a quick demo so you can see exactly how it would work with your current process?"
    }
  },
  {
    leadId: 'lead-3',
    leadName: 'Riverside Dental',
    emailScript: {
      subject: 'Reducing no-shows at Riverside Dental',
      body: `Hi Dr. Watson,

I noticed Riverside Dental has great reviews - your patients clearly love the care they receive. One challenge many practices like yours face is appointment no-shows and follow-up management.

We've helped dental practices reduce no-shows by up to 40% with automated reminders and smart follow-up sequences.

Would you be open to a brief conversation about how we might help Riverside Dental?

Best,
[Your Name]`,
      followUp1: `Hi Dr. Watson,

Following up on my previous note. I recently helped a dental practice similar to Riverside reduce their no-show rate from 18% to under 8%.

If no-shows or patient follow-up are challenges you're facing, I'd love to share what worked for them.

Do you have 15 minutes this week?

Best,
[Your Name]`,
      followUp2: `Hi Dr. Watson,

Last message from me - I know running a practice keeps you incredibly busy.

If you're ever interested in learning how other dental practices are tackling no-shows and improving patient follow-up, I'm happy to chat whenever it's convenient.

Best,
[Your Name]`
    },
    callScript: {
      opener: "Hi Dr. Watson, this is [Your Name]. I help dental practices reduce no-shows and improve patient follow-up. Do you have a quick moment?",
      valueProposition: "We've helped practices like Riverside Dental reduce no-shows by up to 40% with automated reminders and smart follow-up. Most see results within the first month.",
      questions: [
        "What's your current no-show rate looking like?",
        "How do you handle patient follow-up today?",
        "Are you using any automation for appointment reminders?",
        "What would it mean for your practice to cut no-shows in half?"
      ],
      objectionHandlers: {
        "We don't have budget": "I understand budgets are tight. Most practices see the solution pay for itself within 60 days through reduced no-shows. Would it help to see the math?",
        "We're too busy right now": "That's actually a great sign you might need this - the automation handles everything so your staff can focus on patients.",
        "We already have a solution": "Great! What's working well with your current reminder system? Any gaps you'd like to fill?",
        "I need to think about it": "Absolutely. What specific questions can I answer to help you make the decision?"
      },
      closeAttempt: "Based on what you've shared, it sounds like we could make a real impact on Riverside's no-show rate. Want to schedule a quick demo to see how it would work for your practice?"
    }
  },
  {
    leadId: 'lead-4',
    leadName: 'Urban Eats Restaurant',
    emailScript: {
      subject: 'Simplifying online ordering for Urban Eats',
      body: `Hi James,

I came across Urban Eats and your menu looks amazing! I know restaurant owners often struggle with complex online ordering systems and keeping customers coming back.

We've helped restaurants like yours simplify online ordering and boost repeat customer rates by up to 35%.

Would you be interested in a quick chat about how we might help Urban Eats?

Best,
[Your Name]`,
      followUp1: `Hi James,

Quick follow-up - I wanted to share that we recently helped a restaurant similar to Urban Eats increase their online orders by 50% just by simplifying their ordering flow.

If online ordering complexity or customer retention are challenges you're facing, I'd love to share what worked.

Got 15 minutes this week?

Best,
[Your Name]`,
      followUp2: `Hi James,

Last note from me - I know running a restaurant keeps you on your feet!

If you're ever curious about how other restaurants are simplifying online ordering and bringing customers back, I'm always happy to chat.

Best,
[Your Name]`
    },
    callScript: {
      opener: "Hi James, this is [Your Name]. I help restaurants simplify their online ordering and improve customer retention. Got a quick moment?",
      valueProposition: "We help restaurants like Urban Eats simplify online ordering and boost repeat customers. Our restaurant clients typically see 35% higher repeat rates within 90 days.",
      questions: [
        "How's your online ordering system working for you right now?",
        "What percentage of your customers are repeat visitors?",
        "What's the biggest headache with your current setup?",
        "If you could fix one thing about your online ordering, what would it be?"
      ],
      objectionHandlers: {
        "We don't have budget": "I get it - margins are tight in restaurants. But most of our clients see the system pay for itself in increased orders. Want to see some numbers?",
        "We're too busy right now": "That's the restaurant life! The good news is this actually saves you time once it's set up. When would be a better time to chat?",
        "We already have a solution": "Nice! What's working well? And where do you wish it was better?",
        "I need to think about it": "Of course. What's the main thing you'd want to know before making a decision?"
      },
      closeAttempt: "It sounds like Urban Eats could really benefit from a simpler ordering system. How about a quick demo to show you exactly how it would work?"
    }
  },
  {
    leadId: 'lead-5',
    leadName: 'Summit Real Estate',
    emailScript: {
      subject: 'Faster lead response for Summit Real Estate',
      body: `Hi Lisa,

I noticed Summit Real Estate has an impressive property portfolio. In real estate, I know that response time can make or break a deal - and matching the right properties to buyers quickly is crucial.

We've helped real estate agencies reduce lead response time to under 5 minutes and improve property matching accuracy by 60%.

Would you be open to a quick conversation about how we might help Summit Real Estate close more deals?

Best,
[Your Name]`,
      followUp1: `Hi Lisa,

Following up on my previous email. I recently helped a real estate agency similar to Summit reduce their average lead response time from 2 hours to under 5 minutes.

If lead response time or property matching are areas you're looking to improve, I'd love to share how they did it.

Do you have 15 minutes this week?

Best,
[Your Name]`,
      followUp2: `Hi Lisa,

Last note from me - I know real estate keeps you constantly on the move.

If you're ever interested in learning how other agencies are speeding up lead response and improving property matching, I'm always happy to chat.

Best,
[Your Name]`
    },
    callScript: {
      opener: "Hi Lisa, this is [Your Name]. I help real estate agencies respond to leads faster and match properties more accurately. Do you have a quick moment?",
      valueProposition: "We help agencies like Summit Real Estate respond to leads in under 5 minutes and improve property matching by 60%. Faster response means more closed deals.",
      questions: [
        "What's your current average response time to new leads?",
        "How do you match properties to buyer preferences today?",
        "How many leads do you estimate you lose to slower competitors?",
        "What would it mean for Summit if you could respond to every lead within 5 minutes?"
      ],
      objectionHandlers: {
        "We don't have budget": "I understand. But consider this - if faster response helps you close just one more deal per month, the system pays for itself many times over.",
        "We're too busy right now": "That's exactly why automation helps - it handles the immediate response so you can focus on showings and closings.",
        "We already have a solution": "Great! What's working well with your current system? And where do you see room for improvement?",
        "I need to think about it": "Absolutely. What specific information would help you make the decision?"
      },
      closeAttempt: "Based on our conversation, it sounds like faster lead response could really help Summit close more deals. Want to schedule a quick demo to see exactly how it would work?"
    }
  }
];

// Create a complete LeadsArtifact from dummy data
export const DUMMY_LEADS_ARTIFACT: LeadsArtifact = {
  leads: DUMMY_LEADS,
  idealCustomerProfile: {
    industries: ['SaaS', 'Marketing', 'Healthcare', 'Food & Beverage', 'Real Estate'],
    companySize: '10-100 employees',
    painPoints: ['Manual processes', 'Slow response times', 'Customer retention', 'Lead qualification'],
    budget: '$500-5,000/month'
  },
  searchCriteria: 'Demo leads for testing CRM functionality'
};

// Create a complete OutreachArtifact from dummy data
export const DUMMY_OUTREACH_ARTIFACT: OutreachArtifact = {
  scripts: DUMMY_OUTREACH_SCRIPTS
};

// Helper to check if we should use dummy data (no real leads exist)
export function shouldUseDummyData(leads: LeadsArtifact | null): boolean {
  return !leads || leads.leads.length === 0;
}

// Helper to merge dummy data with real data for testing
export function getLeadsWithDummyFallback(leads: LeadsArtifact | null): LeadsArtifact {
  if (shouldUseDummyData(leads)) {
    return DUMMY_LEADS_ARTIFACT;
  }
  return leads!;
}

export function getOutreachWithDummyFallback(outreach: OutreachArtifact | null, leads: LeadsArtifact | null): OutreachArtifact {
  if (!outreach && shouldUseDummyData(leads)) {
    return DUMMY_OUTREACH_ARTIFACT;
  }
  return outreach || { scripts: [] };
}
