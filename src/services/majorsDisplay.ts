export interface MajorReport {
    name: string;
    tagline?: string;
    traitChips?: string[];
    personalFitSummary?: string;
    connectionSummary?: string;
    studyOverview?: string;
    coreSubjects?: string[];
    childMajors?: string[];
    careerPaths?: string[];
    workSettings?: string[];
    skills?: string[];
    studySnapshot?: string;
    prosChallenges?: string;
    footer?: string;
    rawSection?: string;
}

type MajorReportMap = Record<string, MajorReport>;

const SECTION_MARKERS = [
    '1. Your Personal Fit Summary',
    '2. Where You and This Major Connect',
    '3. What You Study in This Major',
    '4. Child Majors / Specializations',
    '5. Career Paths & Job Roles',
    '6. Skills You Gain',
    '7. Study Snapshot',
    '8. Pros, Challenges & Misconceptions',
    'Footer'
] as const;

const headerRegex = /^(\d+)\.\s+(.+?)\s+—\s+Full Report Card/;

export const normalizeMajorName = (name: string): string =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const buildBlocks = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    const blocks: string[][] = [];
    let current: string[] = [];

    lines.forEach(line => {
        if (headerRegex.test(line) && current.length) {
            blocks.push(current);
            current = [line];
        } else {
            current.push(line);
        }
    });

    if (current.length) {
        blocks.push(current);
    }

    return blocks;
};

const extractSection = (lines: string[], label: string): string => {
    const startIdx = lines.findIndex(line => line.trim().startsWith(label));
    if (startIdx === -1) return '';

    const nextIdx = lines.findIndex((line, idx) =>
        idx > startIdx && SECTION_MARKERS.some(marker => line.trim().startsWith(marker))
    );

    const slice = lines.slice(startIdx + 1, nextIdx === -1 ? lines.length : nextIdx);
    return slice.join('\n').trim();
};

const extractList = (section?: string, removePrefixes: string[] = []): string[] => {
    if (!section) return [];

    return section
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const cleaned = removePrefixes.reduce((acc, prefix) => {
                if (acc.toLowerCase().startsWith(prefix.toLowerCase())) {
                    return acc.slice(prefix.length).trim().replace(/^:/, '').trim();
                }
                return acc;
            }, line);

            return cleaned.replace(/^[-•]\s*/, '').trim();
        })
        .filter(
            line =>
                line.length > 0 &&
                !/^\d+\./.test(line) &&
                !removePrefixes.some(prefix => line.toLowerCase().startsWith(prefix.toLowerCase()))
        );
};

const extractCoreSubjects = (section: string): string[] => {
    if (!section) return [];
    const lines = section.split('\n').map(line => line.trim());
    const start = lines.findIndex(line => line.toLowerCase().startsWith('core subjects'));
    if (start === -1) return [];

    const subjects = lines.slice(start + 1).filter(line => line.length > 0);
    return subjects.map(subject => subject.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
};

export const parseMajorsDisplay = (text: string): MajorReportMap => {
    const blocks = buildBlocks(text);
    const reports: MajorReportMap = {};

    blocks.forEach(block => {
        const headerLine = block.find(line => headerRegex.test(line));
        const nameMatch = headerLine ? headerLine.match(headerRegex) : null;
        const name = nameMatch?.[2]?.trim();
        if (!name) return;

        const tagline = block.find(line => line.startsWith('Tagline:'))?.split('Tagline:')[1]?.trim();
        const traitChipsLine = block.find(line => line.startsWith('Trait Chips:'));
        const traitChips = traitChipsLine
            ? traitChipsLine
                  .replace('Trait Chips:', '')
                  .split('•')
                  .map(chip => chip.trim())
                  .filter(Boolean)
            : [];

        const personalFitSummary = extractSection(block, SECTION_MARKERS[0]);
        const connectionSummary = extractSection(block, SECTION_MARKERS[1]);
        const studyOverview = extractSection(block, SECTION_MARKERS[2]);
        const coreSubjects = extractCoreSubjects(studyOverview);
        const childMajors = extractList(extractSection(block, SECTION_MARKERS[3]));

        const careerSection = extractSection(block, SECTION_MARKERS[4]);
        const careerPaths = extractList(careerSection, ['Core Career Routes:', 'Adjacent Roles:']);
        const workSettingsLine = careerSection
            .split('\n')
            .map(line => line.trim())
            .find(line => line.toLowerCase().startsWith('work settings'));
        const workSettings = workSettingsLine
            ? workSettingsLine
                  .replace(/work settings\s*:/i, '')
                  .split('•')
                  .map(entry => entry.trim())
                  .filter(Boolean)
            : [];

        const skills = extractList(extractSection(block, SECTION_MARKERS[5]), [
            'Technical / Domain Skills:',
            'Transferable Skills:'
        ]);

        const studySnapshot = extractSection(block, SECTION_MARKERS[6]);
        const prosChallenges = extractSection(block, SECTION_MARKERS[7]);
        const footer = extractSection(block, SECTION_MARKERS[8]);

        reports[normalizeMajorName(name)] = {
            name,
            tagline,
            traitChips,
            personalFitSummary,
            connectionSummary,
            studyOverview,
            coreSubjects,
            childMajors,
            careerPaths,
            workSettings,
            skills,
            studySnapshot,
            prosChallenges,
            footer,
            rawSection: block.join('\n').trim()
        };
    });

    return reports;
};

export const loadMajorReports = async (): Promise<MajorReportMap> => {
    const majorsDisplayUrl = `${process.env.PUBLIC_URL || ''}/MajorsDisplay.txt`;
    const response = await fetch(majorsDisplayUrl);
    if (!response.ok) {
        throw new Error(`Failed to load MajorsDisplay.txt (${response.status})`);
    }

    const text = await response.text();
    return parseMajorsDisplay(text);
};

export type { MajorReportMap };

