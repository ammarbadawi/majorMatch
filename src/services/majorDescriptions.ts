// Service to load and parse major descriptions from the Mapping folder
// This service provides a mapping between major names and their detailed descriptions

interface MajorDescription {
    name: string;
    description: string;
    careerPaths: string[];
    industries: string[];
    whyFutureProof: string;
}

// Major descriptions loaded from the Mapping folder
const majorDescriptions: { [key: string]: MajorDescription } = {
    // Computing and IT
    "Computer Science": {
        name: "Computer Science & Data",
        description: "You think in systems, spot patterns, and love solving problems others find overwhelming. Computer Science & Data is the natural home for your analytical brain and curiosity. Whether you're debugging a complex algorithm or building software from scratch, your mind thrives in this world of logic, language, and endless innovation.\n\nYou'll find purpose in turning abstract logic into practical tools that shape how people live and work. If you enjoy independent deep work, structured challenges, and digital creativity, this field offers both freedom and structure — and plenty of chances to build what matters.",
        careerPaths: ["Software Developer", "Data Analyst", "AI Researcher"],
        industries: ["Tech", "finance", "education", "healthcare", "cybersecurity"],
        whyFutureProof: "As automation, AI, and data become central to every industry, those who code the systems will shape the future."
    },
    "Information Technology": {
        name: "Information Technology",
        description: "You're practical, reliable, and solution-focused — the kind of person who wants systems to work and people to thrive. Information Technology is a natural fit for your tech-savvy mind and hands-on approach. Whether it's setting up networks, securing data, or solving user problems, your strength lies in making complex systems run smoothly behind the scenes.\n\nIf you enjoy troubleshooting, logical thinking, and helping others through technical support or digital systems, this major gives you real-world impact with every fix and upgrade.",
        careerPaths: ["IT Support Specialist", "Network Administrator", "Systems Analyst"],
        industries: ["Business", "education", "healthcare", "government", "enterprise tech"],
        whyFutureProof: "In a world that runs on digital infrastructure, IT experts are the guardians of security, access, and operational flow."
    },
    "Digital Marketing": {
        name: "Marketing & Advertising",
        description: "You're expressive, strategic, and know how to read people. Marketing & Advertising is where your creativity becomes influence — whether through campaigns, branding, or digital storytelling. You don't just sell products; you shape how people feel about them.\n\nThis major fits communicative, trend-aware individuals who love psychology, media, and creative problem-solving. If you enjoy making messages that stick, this is where your voice can shine.",
        careerPaths: ["Marketing Strategist", "Brand Manager", "Digital Advertiser"],
        industries: ["Retail", "media", "tech", "consumer goods", "agencies"],
        whyFutureProof: "As markets shift and competition grows, businesses need storytellers who can cut through the noise."
    },

    // Business & Management
    "Business Administration": {
        name: "Business Administration & Management",
        description: "You're strategic, driven, and know how to see the bigger picture. Business Administration & Management is where leadership meets structure — giving you the tools to plan, operate, and grow organizations across industries.\n\nIf you're the type who naturally takes initiative, enjoys solving operational problems, and likes rallying people toward a goal, this major gives you both the challenge and the impact you're seeking.",
        careerPaths: ["Business Manager", "Operations Officer", "Management Consultant"],
        industries: ["Corporate", "startups", "nonprofits", "retail", "services"],
        whyFutureProof: "Every sector needs people who can manage resources and lead teams toward efficient, scalable growth."
    },
    "Accounting": {
        name: "Accounting & Finance",
        description: "You're structured, precise, and naturally analytical. Accounting & Finance is your domain if you find satisfaction in balance sheets, financial forecasting, and smart risk management. You don't just track numbers — you make sense of them and help others make informed decisions.\n\nThis major suits detail-oriented thinkers who enjoy patterns, logic, and responsibility. If you love solving numerical puzzles and want a role that keeps organizations grounded, this is your financial edge.",
        careerPaths: ["Accountant", "Financial Analyst", "Auditor", "Budget Planner"],
        industries: ["Banking", "corporate finance", "government", "investment firms"],
        whyFutureProof: "With every company needing to manage risk, growth, and transparency, skilled financial minds are always in demand."
    },
    "Human Resources": {
        name: "Human Resource Management",
        description: "You're empathetic, organized, and care about how people work best. Human Resource Management is the major for those who want to build better workplaces — from hiring and training to well-being and performance strategy.\n\nThis major suits those who blend emotional intelligence with structure. If you enjoy working with people, resolving conflict, and improving team dynamics, you'll thrive where people and policy meet.",
        careerPaths: ["HR Officer", "Talent Development Manager", "Organizational Consultant"],
        industries: ["Corporate HR", "recruitment agencies", "government", "nonprofit organizations"],
        whyFutureProof: "With employee well-being and talent strategy becoming a business priority, HR professionals are more strategic than ever."
    },
    "Entrepreneurship": {
        name: "Entrepreneurship & Innovation",
        description: "You're a big thinker with bold ideas and the drive to make them real. Entrepreneurship & Innovation is for those who see gaps in the market and can't help but ask, \"What if?\" Whether launching your own venture or leading change within a company, you turn vision into action.\n\nThis major suits independent, resourceful minds who aren't afraid of uncertainty. If you thrive on problem-solving, adaptability, and turning creativity into results — this path is your launchpad.",
        careerPaths: ["Startup Founder", "Business Developer", "Innovation Strategist"],
        industries: ["Startups", "tech", "social enterprises", "product design", "consultancy"],
        whyFutureProof: "As economies evolve and automation disrupts jobs, innovators and creators will shape what comes next."
    },

    // Engineering
    "Civil Engineering": {
        name: "Civil Engineering",
        description: "Civil Engineering is the perfect fit for your logic-driven, process-oriented mind. In this field, you won't just crunch numbers — you'll use them to shape the real world. From roads and water systems to bridges and towers, your structured thinking will turn plans into places people rely on every day.\n\nAs someone who likes order and tangible results, you'll thrive in the precise planning, calculations, and decision-making this major demands. Whether you're managing a construction site or analyzing load-bearing structures, you'll always see how your work stands tall in people's lives.",
        careerPaths: ["Structural Engineer", "Site Planner", "Urban Infrastructure Designer"],
        industries: ["Construction", "public works", "transportation", "urban development"],
        whyFutureProof: "Countries everywhere are investing in smart cities and green infrastructure — skilled civil engineers are key to this future."
    },
    "Mechanical Engineering": {
        name: "Mechanical Engineering",
        description: "You're hands-on, curious, and love figuring out how things work. Mechanical Engineering is the core of physical innovation — from engines and machines to robotics and manufacturing systems. If you're drawn to motion, energy, and problem-solving, this is your home base.\n\nThis major suits practical thinkers who love both designing and testing. You'll thrive in a field that rewards creativity, accuracy, and the power to improve almost every industry.",
        careerPaths: ["Mechanical Systems Engineer", "Product Designer", "Robotics Specialist"],
        industries: ["Automotive", "aerospace", "manufacturing", "energy", "research and development"],
        whyFutureProof: "As machines evolve to be smarter and greener, mechanical engineers will keep innovation in motion."
    },
    "Electrical Engineering": {
        name: "Electrical Engineering",
        description: "You're analytical, precise, and energized by complex systems. Electrical Engineering gives you the tools to power cities, enable communication, and control everything from microchips to massive power grids.\n\nThis major suits those who enjoy math, circuitry, and abstract thinking. If you're fascinated by how invisible systems make the world run — from signals to current to code — you'll thrive here.",
        careerPaths: ["Power Systems Engineer", "Circuit Designer", "Control Systems Specialist"],
        industries: ["Power generation", "telecommunications", "electronics", "aerospace", "renewable energy"],
        whyFutureProof: "As demand for smart systems and clean energy grows, electrical engineers are lighting the way forward."
    },
    "Computer Engineering": {
        name: "Computer & Communications Engineering",
        description: "You're a systems thinker with a love for speed, structure, and scale. Computer & Communications Engineering is perfect for those who want to build the backbone of today's digital world — from processors and embedded systems to data networks and communication protocols.\n\nIf you like logic, computing, and real-world tech solutions, this major gives you both depth and flexibility. You'll design the tech that connects our lives.",
        careerPaths: ["Embedded Systems Engineer", "Network Engineer", "Telecom Specialist"],
        industries: ["Telecommunications", "hardware design", "IoT", "defense", "wireless systems"],
        whyFutureProof: "As connectivity becomes core to everything — from smart cities to global business — this field powers what's next."
    },

    // Health & Medicine
    "Medicine": {
        name: "Medicine",
        description: "You're compassionate, analytical, and driven by the desire to heal and help others. Medicine is where science meets humanity — giving you the knowledge and skills to diagnose, treat, and prevent illness while making a profound difference in people's lives.\n\nThis major suits those who are dedicated, detail-oriented, and thrive under pressure. If you're passionate about understanding the human body and committed to lifelong learning, medicine offers both intellectual challenge and deep personal fulfillment.",
        careerPaths: ["Physician", "Surgeon", "Medical Specialist", "Medical Researcher"],
        industries: ["Hospitals", "clinics", "research institutions", "public health", "private practice"],
        whyFutureProof: "Healthcare is a fundamental human need, and medical professionals will always be essential to society's well-being."
    },
    "Nursing": {
        name: "Nursing",
        description: "You're caring, resilient, and dedicated to making a difference in people's lives during their most vulnerable moments. Nursing combines scientific knowledge with compassionate care — allowing you to be both a healer and a comfort to patients and their families.\n\nThis major suits those who are empathetic, organized, and thrive in fast-paced environments. If you're drawn to helping others and want a career that offers both stability and meaningful impact, nursing provides endless opportunities to serve.",
        careerPaths: ["Registered Nurse", "Nurse Practitioner", "Nurse Educator", "Clinical Nurse Specialist"],
        industries: ["Hospitals", "clinics", "home healthcare", "schools", "public health"],
        whyFutureProof: "With an aging population and increasing healthcare needs, skilled nurses are more essential than ever."
    },

    // Arts & Design
    "Graphic Design": {
        name: "Graphic Design",
        description: "You're creative, visual, and have an eye for what makes designs both beautiful and functional. Graphic Design is where art meets communication — allowing you to tell stories, convey messages, and create visual experiences that connect with people on an emotional level.\n\nThis major suits those who are artistic, detail-oriented, and enjoy solving visual problems. If you love combining creativity with strategy and want to make ideas come alive through design, this field offers endless opportunities for expression and impact.",
        careerPaths: ["Graphic Designer", "Brand Designer", "UI/UX Designer", "Creative Director"],
        industries: ["Advertising", "publishing", "tech", "fashion", "entertainment"],
        whyFutureProof: "In a visual world where brands compete for attention, skilled designers who can create compelling visual experiences are invaluable."
    },

    // Education
    "Education": {
        name: "Primary Education Teaching",
        description: "You're structured, warm, and love helping students grow through each subject and stage. Primary Education Teaching is perfect for those who enjoy guiding children through reading, math, science, and beyond — and who see education as a journey, not just a curriculum.\n\nThis major fits organized, caring individuals who want to balance discipline with encouragement. If you're the kind of person who makes others feel seen and supported, your classroom will become a place of possibility.",
        careerPaths: ["Elementary School Teacher", "Grade-Level Coordinator", "Literacy Program Facilitator"],
        industries: ["Public and private schools", "education programs", "curriculum development"],
        whyFutureProof: "Foundational education will always need great teachers — especially those who can lead with empathy and structure."
    },
    "Early Childhood Education": {
        name: "Early Childhood Education",
        description: "You're nurturing, patient, and deeply attuned to how young children grow. Early Childhood Education is the major for those who believe that the earliest years matter most — where curiosity, confidence, and kindness are built with every story, song, and supportive word.\n\nThis major suits emotionally intelligent individuals who enjoy creative learning environments and guiding young minds through their first steps into the world. If you're energized by tiny breakthroughs and lasting impact, this is where your heart belongs.",
        careerPaths: ["Preschool Teacher", "Early Learning Specialist", "Childcare Program Developer"],
        industries: ["Schools", "nurseries", "early learning centers", "educational NGOs"],
        whyFutureProof: "As families and nations prioritize strong foundations for youth, skilled early educators are more essential than ever."
    },

    "Pharmacy": {
        name: "Pharmacy",
        description: "You're meticulous, knowledgeable, and care about getting things exactly right. Pharmacy is where chemistry, health, and safety intersect. Whether you're behind the counter or deep in research, your precision helps patients get better — safely and effectively.\n\nThis major fits students who love chemistry, pharmacology, and working directly with people. If you want a role that blends scientific accuracy with real-world care, pharmacy is your formula for impact.",
        careerPaths: ["Pharmacist", "Clinical Pharmacy Consultant", "Drug Safety Specialist"],
        industries: ["Community pharmacies", "hospitals", "pharma companies", "regulatory bodies"],
        whyFutureProof: "As medications grow more complex and personalized, pharmacists are the experts who ensure they're used wisely."
    },

    // Arts & Design - More comprehensive
    "Architecture": {
        name: "Architecture & Built Arts",
        description: "You see structure and beauty as partners. With a brain that balances creativity and logic, Architecture & Built Arts is your blueprint to turn imagination into places people live, gather, and grow. Whether sketching a concept or perfecting a model, you think in dimensions — and design with purpose.\n\nThis major suits those who love visual thinking, math, and problem-solving. If you're inspired by buildings, cities, and how design impacts daily life, you'll thrive in this mix of art, engineering, and cultural vision.",
        careerPaths: ["Architect", "Urban Designer", "Environmental Planner"],
        industries: ["Architecture firms", "construction", "city planning", "real estate development"],
        whyFutureProof: "As cities evolve to become smarter and more sustainable, thoughtful architects will lead the way."
    },
    "Animation": {
        name: "Animation & Multimedia",
        description: "You think in motion and dream in color. Animation & Multimedia is where imagination becomes experience — whether it's in games, films, or digital storytelling. If you're always sketching characters, experimenting with visuals, or syncing sound with story, this is your canvas.\n\nThis major is perfect for those who love visual storytelling, technology, and emotional design. You'll thrive in environments that reward creativity, patience, and bringing fantasy to life, one frame at a time.",
        careerPaths: ["Animator", "Motion Designer", "3D Artist"],
        industries: ["Film & television", "gaming", "advertising", "digital content studios"],
        whyFutureProof: "As visual content dominates entertainment and marketing, skilled animators are always in demand."
    },
    "Fine Arts": {
        name: "Fine & Studio Arts",
        description: "You feel things deeply and express them boldly. Fine & Studio Arts is for the visionaries — the painters, sculptors, illustrators, and experimental creators. It's about translating your inner world into physical or digital forms that make others stop and feel.\n\nThis major suits introspective, passionate individuals who thrive with freedom, exploration, and emotional depth. If you see the world differently — and want to show others how — art is your language.",
        careerPaths: ["Studio Artist", "Illustrator", "Gallery Curator"],
        industries: ["Fine arts", "museums", "publishing", "cultural foundations"],
        whyFutureProof: "In an age of AI and algorithms, original human creativity has never been more valuable — or needed."
    }
};

// Function to get major description by name
export const getMajorDescription = (majorName: string): MajorDescription | null => {
    // Try exact match first
    if (majorDescriptions[majorName]) {
        return majorDescriptions[majorName];
    }

    // Try partial matching for variations
    const normalizedName = majorName.toLowerCase().trim();
    for (const [key, description] of Object.entries(majorDescriptions)) {
        if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
            return description;
        }
    }

    // Return null if no match found
    return null;
};

// Function to get all available major names
export const getAllMajorNames = (): string[] => {
    return Object.keys(majorDescriptions);
};

// Function to search majors by keyword
export const searchMajors = (keyword: string): MajorDescription[] => {
    const results: MajorDescription[] = [];
    const normalizedKeyword = keyword.toLowerCase();

    for (const [key, description] of Object.entries(majorDescriptions)) {
        if (
            key.toLowerCase().includes(normalizedKeyword) ||
            description.name.toLowerCase().includes(normalizedKeyword) ||
            description.description.toLowerCase().includes(normalizedKeyword) ||
            description.careerPaths.some(path => path.toLowerCase().includes(normalizedKeyword)) ||
            description.industries.some(industry => industry.toLowerCase().includes(normalizedKeyword))
        ) {
            results.push(description);
        }
    }

    return results;
};

export default majorDescriptions;
