/**
 * Industry Context Library
 *
 * Provides industry-specific copywriting guidelines, content themes, trust signals,
 * and CTA language to make generated websites feel less generic and more tailored.
 */

export interface IndustryContext {
  industry: string;
  tone: string[];
  contentThemes: string[];
  sectionPriorities: string[];
  copyGuidelines: string;
  visualEmphasis: string;
  ctaLanguage: string[];
  trustSignals: string[];
}

export const INDUSTRY_CONTEXTS: Record<string, IndustryContext> = {
  smma: {
    industry: 'Social Media Marketing Agency',
    tone: ['results-driven', 'data-focused', 'professional', 'confident'],
    contentThemes: ['ROI metrics', 'client results', 'growth numbers', 'social proof', 'case studies'],
    sectionPriorities: [
      'Hero: "Get X% More Leads with Our Proven Strategy"',
      'Client Results: Show specific metrics (followers, engagement, revenue)',
      'Case Studies: Real before/after stories with numbers',
      'Services: Specific to social platforms (TikTok, Instagram, LinkedIn)',
      'Client Testimonials: Quote measurable results',
      'Pricing: Clear ROI-based packages',
    ],
    copyGuidelines: 'Use specific numbers (e.g., "300% follower growth", "$50k revenue in 90 days"). Always emphasize measurable outcomes and ROI. Address business pain points (stagnant growth, low engagement, poor conversion). Use action-oriented language.',
    visualEmphasis: 'Screenshots of analytics dashboards, before/after metrics, client social profiles, growth charts, success milestone badges',
    ctaLanguage: ['Book Your Strategy Call', 'Claim Your Free Audit', 'See Your Growth Potential', 'Get Your Custom Strategy', 'Schedule a Consultation'],
    trustSignals: ['Client logos', 'Success metrics dashboard', 'Years in business', 'Industry certifications (Meta Partner, TikTok Partner)', 'Award mentions'],
  },
  ai_automation: {
    industry: 'AI Automation Agency',
    tone: ['innovative', 'technical', 'forward-thinking', 'confident'],
    contentThemes: ['AI capabilities', 'automation benefits', 'efficiency gains', 'cost savings', 'workflow optimization'],
    sectionPriorities: [
      'Hero: "Automate Your Business with AI"',
      'How It Works: Step-by-step automation process',
      'Use Cases: Industry-specific automation examples',
      'ROI Calculator: Show time and cost savings',
      'Integrations: Showcase compatible tools',
      'Implementation: Timeline and support',
    ],
    copyGuidelines: 'Focus on problem-solution-outcome. Explain complex AI concepts simply. Emphasize time savings and cost reduction. Use phrases like "24/7 automation", "zero-downtime implementation", "plug-and-play integration". Address implementation fears directly.',
    visualEmphasis: 'Workflow diagrams, process flows, integration icons, before/after efficiency comparisons, code snippets or API documentation',
    ctaLanguage: ['Start Your Free Automation Audit', 'Build Your AI Workflow', 'Schedule a Demo', 'Get an Implementation Quote', 'Explore Use Cases'],
    trustSignals: ['Technology partners', 'Successful implementations count', 'Customer testimonials with metrics', 'Technical certifications', 'Case study results'],
  },
  web_design: {
    industry: 'Web Design Agency',
    tone: ['creative', 'modern', 'professional', 'detail-oriented'],
    contentThemes: ['design quality', 'user experience', 'brand transformation', 'portfolio', 'process'],
    sectionPriorities: [
      'Portfolio: Showcase best work with descriptions',
      'Process: Transparent design and development workflow',
      'Services: Design, development, UX, SEO',
      'Client Results: Time to launch, performance metrics',
      'Testimonials: Focus on transformation and satisfaction',
      'Contact: Clear project inquiry form',
    ],
    copyGuidelines: 'Emphasize user experience and visual storytelling. Mention responsive design and mobile-first approach. Highlight industry expertise (e-commerce, SaaS, etc.). Use visual language (design, flow, intuitive, beautiful). Include turnaround times.',
    visualEmphasis: 'Stunning portfolio pieces, website mockups, design system examples, before/after website comparisons, team photos',
    ctaLanguage: ['View Our Portfolio', 'Start Your Project', 'Get a Free Website Audit', 'Schedule a Design Consultation', 'Download Our Process Guide'],
    trustSignals: ['Award-winning designs', 'Client portfolio (recognizable brands)', 'Years in business', 'Technology expertise', 'Team credentials'],
  },
  restaurant: {
    industry: 'Restaurant',
    tone: ['warm', 'inviting', 'passionate', 'descriptive'],
    contentThemes: ['food quality', 'ambiance', 'chef expertise', 'menu highlights', 'dining experience'],
    sectionPriorities: [
      'Hero: Beautiful food photography with atmosphere',
      'Story: Chef background and culinary philosophy',
      'Menu Highlights: Signature dishes with descriptions',
      'Ambiance: Restaurant atmosphere and experience',
      'Location & Hours: Easy reservation system',
      'Reviews: Customer testimonials and ratings',
    ],
    copyGuidelines: 'Use sensory language (aromas, textures, flavors, presentation). Tell the story of sourcing and preparation. Mention chef credentials and accolades. Use appetizing descriptions. Include pricing and reservation info prominently.',
    visualEmphasis: 'High-quality food photography, restaurant interior photos, chef in action, dining ambiance, plated dishes, happy customers',
    ctaLanguage: ['Reserve Your Table', 'Order Online', 'Experience Our Menu', 'Make a Reservation', 'See Our Specials'],
    trustSignals: ['Michelin stars or awards', 'Chef credentials', 'Press features', 'Reservation difficulty/popularity', 'Customer reviews'],
  },
  gym: {
    industry: 'Gym / Fitness Center',
    tone: ['motivational', 'supportive', 'energetic', 'inclusive'],
    contentThemes: ['fitness transformation', 'community', 'affordable pricing', 'class variety', 'results'],
    sectionPriorities: [
      'Hero: Transformation stories and fitness motivation',
      'Classes: Variety of programs (CrossFit, yoga, etc.)',
      'Pricing: Clear membership tiers with no hidden fees',
      'Trainers: Certified trainer bios with expertise',
      'Facilities: Equipment, cleanliness, amenities',
      'Community: Success stories and member photos',
    ],
    copyGuidelines: 'Emphasize accessibility and value. Use motivational but achievable language. Highlight "no commitment", "cancel anytime", "flexible schedules". Address barriers to entry (intimidation, cost, time). Celebrate all fitness levels.',
    visualEmphasis: 'Member transformation photos, class in progress, modern equipment, trainer guidance, happy members, facility cleanliness',
    ctaLanguage: ['Start Your Free Week', 'Join for $19/mo', 'No Contracts, Cancel Anytime', 'Claim Your Trial', 'Get Fit Today'],
    trustSignals: ['Member count', 'Trainer certifications (NASM, ACE)', 'Transformation stories', 'Class attendance numbers', 'Member retention rates'],
  },
  dentist: {
    industry: 'Dental Practice',
    tone: ['professional', 'reassuring', 'expert', 'caring'],
    contentThemes: ['patient comfort', 'expertise', 'technology', 'preventive care', 'results'],
    sectionPriorities: [
      'Hero: Patient comfort and care focus',
      'Services: Comprehensive dental services with explanations',
      'Technology: Modern equipment and techniques',
      'Team: Dentist and hygienist credentials',
      'Patient Experience: Comfort measures and calm environment',
      'Testimonials: Patient satisfaction and results',
    ],
    copyGuidelines: 'Address dental anxiety directly. Emphasize pain-free procedures and patient comfort. Explain procedures in patient-friendly language. Highlight modern technology. Mention emergency availability. Include insurance information.',
    visualEmphasis: 'Modern dental office, friendly staff, technology showcase, patient testimonials, before/after smile transformations, calming office environment',
    ctaLanguage: ['Schedule Your Checkup', 'Book an Appointment', 'New Patient Special', 'Get Your Smile Consultation', 'Call for Emergency Care'],
    trustSignals: ['Dentist credentials (DDS/DMD)', 'Specializations', 'Years in practice', 'Patient reviews', 'Insurance accepted'],
  },
  lawyer: {
    industry: 'Law Firm',
    tone: ['professional', 'authoritative', 'trustworthy', 'expert'],
    contentThemes: ['expertise', 'client success', 'experience', 'specialization', 'legal strategy'],
    sectionPriorities: [
      'Hero: Specific practice areas and track record',
      'Practice Areas: Detailed explanation of services',
      'Team: Attorney bios with credentials and experience',
      'Results: Case outcomes and client testimonials',
      'Process: How the legal process works',
      'Contact: Free consultation form',
    ],
    copyGuidelines: 'Be specific about practice areas and experience. Include years in practice and case outcomes. Explain legal concepts clearly. Use testimonials from real clients. Include ethical disclaimers. Focus on results and client satisfaction.',
    visualEmphasis: 'Professional team photos, office spaces, certificates and credentials, legal books, courtroom/meeting settings, success metrics',
    ctaLanguage: ['Schedule Your Free Consultation', 'Discuss Your Case', 'Get Legal Advice', 'Book a Strategy Session', 'Call for Immediate Help'],
    trustSignals: ['Bar certification', 'Years in practice', 'Successful cases', 'Professional memberships (Bar Association)', 'Client testimonials'],
  },
  realtor: {
    industry: 'Real Estate Agent / Brokerage',
    tone: ['professional', 'trustworthy', 'knowledgeable', 'helpful'],
    contentThemes: ['market expertise', 'buyer/seller success', 'local knowledge', 'listings', 'neighborhood guides'],
    sectionPriorities: [
      'Hero: "Find Your Perfect Home" or "Sell for Maximum Value"',
      'Listings: Featured properties with photos and details',
      'Market Expertise: Local market data and trends',
      'Success Stories: Client testimonials and sale prices',
      'Neighborhoods: Area guides with schools, amenities',
      'Process: Simple buying/selling timeline',
    ],
    copyGuidelines: 'Include specific market data and trends. Highlight local knowledge and community involvement. Use testimonials with sale prices. Mention negotiation success and market expertise. Include neighborhood information and school ratings.',
    visualEmphasis: 'Beautiful property photos, neighborhood aerial views, market data charts, happy homeowners, office team, property staging examples',
    ctaLanguage: ['Search Homes Now', 'View Listings', 'Get Your Home Valuation', 'Schedule a Showing', 'Start Your Home Journey'],
    trustSignals: ['Years in real estate', 'Properties sold', 'Average sale price', 'Client testimonials', 'Industry certifications'],
  },
  salon: {
    industry: 'Hair Salon / Spa',
    tone: ['warm', 'welcoming', 'expert', 'glamorous'],
    contentThemes: ['beauty transformation', 'relaxation', 'expert care', 'quality products', 'pampering'],
    sectionPriorities: [
      'Hero: Relaxation and transformation promise',
      'Services: Hair, nails, spa treatments with photos',
      'Stylists: Team bios with expertise and specialties',
      'Ambiance: Calm, luxurious environment description',
      'Products: Premium brands and benefits',
      'Specials: New client offers and loyalty programs',
    ],
    copyGuidelines: 'Use sensory and transformational language. Highlight relaxation and self-care. Mention product quality and expertise. Address client concerns (hair damage, time). Include appointment booking ease. Use before/after transformation photos.',
    visualEmphasis: 'Stylist working with client, salon interior beauty, product displays, before/after transformations, happy clients, spa relaxation imagery',
    ctaLanguage: ['Book Your Appointment', 'Claim Your First Haircut Special', 'Schedule a Consultation', 'Get a Free Hair Analysis', 'Experience Our Spa'],
    trustSignals: ['Stylist certifications', 'Years in business', 'Premium product lines', 'Client testimonials', 'Award mentions'],
  },
  saas: {
    industry: 'SaaS / Software Company',
    tone: ['innovative', 'technical', 'friendly', 'value-focused'],
    contentThemes: ['product features', 'business outcomes', 'integrations', 'ease of use', 'ROI'],
    sectionPriorities: [
      'Hero: Core problem solved by product',
      'Features: Key benefits with clear explanations',
      'How It Works: Product tour or walkthrough',
      'Integrations: Compatible platforms and tools',
      'Pricing: Clear, transparent pricing tiers',
      'Testimonials: Customer success stories with metrics',
    ],
    copyGuidelines: 'Explain technical concepts simply. Focus on business outcomes, not just features. Use phrases like "seamless integration", "30-day implementation", "proven ROI". Include security and compliance mentions. Offer free trial prominently.',
    visualEmphasis: 'Product screenshots/dashboard, feature demonstrations, integration logos, customer testimonials, growth metrics, implementation timeline',
    ctaLanguage: ['Start Your Free Trial', 'Schedule a Demo', 'See Pricing', 'Get Started Today', 'Request a Custom Quote'],
    trustSignals: ['Customer count', 'Uptime/reliability', 'Security certifications', 'Industry partnerships', 'Case study results'],
  },
  ecommerce: {
    industry: 'E-commerce Store',
    tone: ['engaging', 'exciting', 'trustworthy', 'customer-focused'],
    contentThemes: ['product quality', 'value proposition', 'customer reviews', 'unique products', 'shopping experience'],
    sectionPriorities: [
      'Hero: Compelling product showcase and value',
      'Featured Products: Best sellers with descriptions',
      'Product Categories: Easy navigation structure',
      'Customer Reviews: Authentic testimonials and ratings',
      'Shipping & Returns: Clear, customer-friendly policies',
      'Trust Signals: Security badges, guarantees',
    ],
    copyGuidelines: 'Highlight product benefits and quality. Use customer reviews prominently. Address shipping and return concerns. Emphasize unique products or competitive pricing. Make checkout process obvious. Include multiple payment options and security info.',
    visualEmphasis: 'High-quality product photography, lifestyle photos with products, customer reviews, rating stars, product variants, satisfied customers',
    ctaLanguage: ['Shop Now', 'Explore Our Collection', 'Add to Cart', 'View All Products', 'Claim Your Discount'],
    trustSignals: ['Customer reviews and ratings', 'Years in business', 'Secure payment badges', 'Return policy clarity', 'Social proof (followers, sales count)'],
  },
  consulting: {
    industry: 'Consulting Firm',
    tone: ['expert', 'professional', 'strategic', 'trustworthy'],
    contentThemes: ['industry expertise', 'business transformation', 'proven methodology', 'client success', 'strategic thinking'],
    sectionPriorities: [
      'Hero: Business challenge solved',
      'Services: Consulting specializations explained',
      'Methodology: Proprietary approach and process',
      'Case Studies: Detailed client success stories',
      'Team: Partner and consultant credentials',
      'Engagement: How engagement works',
    ],
    copyGuidelines: 'Emphasize industry expertise and strategic approach. Use case studies with specific results. Explain methodology clearly. Highlight team credentials and experience. Address business transformation benefits. Include client logos.',
    visualEmphasis: 'Team photos, office/meeting environments, strategic diagrams, client logos, team credentials, success metrics, process flows',
    ctaLanguage: ['Schedule a Strategy Session', 'Book a Consultation', 'Discuss Your Challenges', 'Request a Proposal', 'Get Your Roadmap'],
    trustSignals: ['Years in business', 'Industry expertise', 'Client case studies', 'Team credentials', 'Professional affiliations'],
  },
  coach: {
    industry: 'Business Coach / Consultant',
    tone: ['motivational', 'supportive', 'experienced', 'inspiring'],
    contentThemes: ['transformation', 'expertise', 'results', 'student success', 'methodology'],
    sectionPriorities: [
      'Hero: Life/business transformation promise',
      'About Coach: Background and qualifications',
      'Services: Coaching packages and programs',
      'Results: Client transformations and testimonials',
      'Methodology: Coaching approach explained',
      'Testimonials: Real client success stories',
    ],
    copyGuidelines: 'Use transformational and motivational language. Share your story and why you coach. Explain what makes your approach unique. Include client testimonials with before/after stories. Be specific about outcomes. Address client objections.',
    visualEmphasis: 'Coach professional photo, client success photos, testimonial videos, transformation timelines, certificates and credentials, success metrics',
    ctaLanguage: ['Apply for Coaching', 'Book Your Free Consultation', 'Join the Next Cohort', 'Start Your Transformation', 'Schedule a Discovery Call'],
    trustSignals: ['Years of experience', 'Certifications', 'Client testimonials', 'Media features', 'Success transformation count'],
  },
  nonprofit: {
    industry: 'Non-Profit Organization',
    tone: ['mission-driven', 'authentic', 'inspiring', 'transparent'],
    contentThemes: ['mission impact', 'community help', 'donor transparency', 'volunteer opportunities', 'success stories'],
    sectionPriorities: [
      'Hero: Mission and impact statement',
      'Our Work: Specific programs and initiatives',
      'Impact: Measurable results and community stories',
      'Get Involved: Volunteer and donation opportunities',
      'Transparency: Where donations go, budget breakdown',
      'News: Recent accomplishments and updates',
    ],
    copyGuidelines: 'Be authentic and transparent. Tell compelling stories of impact. Use specific numbers (lives changed, dollars distributed). Explain how donations are used. Make volunteering and donation process simple. Celebrate community and team.',
    visualEmphasis: 'Community impact photos, beneficiary stories, volunteer photos, team in action, measurable impact charts, success transformations',
    ctaLanguage: ['Donate Now', 'Volunteer With Us', 'Learn More', 'Join Our Mission', 'Support Our Cause'],
    trustSignals: ['501(c)(3) status', 'Donation transparency', 'Impact metrics', 'Years of service', 'Community testimonials'],
  },
  contractor: {
    industry: 'Home Contractor / Construction',
    tone: ['professional', 'reliable', 'skilled', 'trustworthy'],
    contentThemes: ['quality work', 'project completion', 'expertise', 'before/after transformations', 'customer satisfaction'],
    sectionPriorities: [
      'Hero: Quality craftsmanship and reliability',
      'Services: Roofing, plumbing, electrical, general contracting',
      'Portfolio: Before/after project photos',
      'Process: Project timeline and workflow',
      'Team: Licensed contractors and certifications',
      'Testimonials: Customer satisfaction and reviews',
    ],
    copyGuidelines: 'Emphasize quality and attention to detail. Use before/after project photos prominently. Mention licenses and certifications. Include warranty and guarantee information. Address project timeline expectations. Build trust with customer testimonials.',
    visualEmphasis: 'Before/after project photos, work in progress, finished installations, contractor with tools, satisfied customers, completed homes',
    ctaLanguage: ['Get a Free Quote', 'Schedule Your Inspection', 'See Our Portfolio', 'Request a Consultation', 'Book Your Project'],
    trustSignals: ['Licenses and certifications', 'Years in business', 'Project portfolio', 'Customer testimonials', 'Insurance and bonding'],
  },
};

/**
 * Get industry context by business description
 * Uses keyword matching to detect industry
 */
export function getIndustryContext(businessDescription: string): IndustryContext {
  const description = businessDescription.toLowerCase();

  // Industry keyword matching
  const keywords: Record<string, string[]> = {
    smma: ['smma', 'social media marketing', 'instagram', 'tiktok', 'facebook ads', 'leads', 'social growth'],
    ai_automation: ['ai', 'automation', 'workflow', 'chatbot', 'ai tools', 'automate'],
    web_design: ['web design', 'website', 'web development', 'design agency', 'ui/ux'],
    restaurant: ['restaurant', 'cafe', 'bar', 'pizza', 'dinner', 'cuisine', 'chef'],
    gym: ['gym', 'fitness', 'personal training', 'crossfit', 'yoga studio', 'membership'],
    dentist: ['dentist', 'dental', 'orthodontist', 'teeth cleaning', 'smile'],
    lawyer: ['lawyer', 'law firm', 'attorney', 'legal', 'practice'],
    realtor: ['realtor', 'real estate', 'property', 'homes', 'mls', 'broker'],
    salon: ['salon', 'hair', 'spa', 'beauty', 'stylist', 'nails', 'haircut'],
    saas: ['saas', 'software', 'app', 'platform', 'subscription', 'tool'],
    ecommerce: ['ecommerce', 'store', 'shop', 'products', 'retail', 'sell online'],
    consulting: ['consulting', 'consultant', 'advisory', 'strategy', 'business consulting'],
    coach: ['coach', 'coaching', 'trainer', 'mentor', 'courses', 'training'],
    nonprofit: ['nonprofit', 'charity', 'foundation', 'mission', 'volunteer'],
    contractor: ['contractor', 'construction', 'roofing', 'plumbing', 'electrical', 'builder'],
  };

  // Check for keyword matches
  for (const [industry, words] of Object.entries(keywords)) {
    if (words.some(word => description.includes(word))) {
      return INDUSTRY_CONTEXTS[industry] || INDUSTRY_CONTEXTS.consulting;
    }
  }

  // Default to consulting if no match
  return INDUSTRY_CONTEXTS.consulting;
}
