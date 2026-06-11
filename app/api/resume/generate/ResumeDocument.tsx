import {
  Document,
  type DocumentProps,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import type { GeneratedResume } from "@/agent/resumeGenerator";
import type { ProfileData } from "@/lib/utils";

type Props = {
  profile: ProfileData;
  resume: GeneratedResume;
};

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    color: "black",
  },
  header: {
    marginBottom: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  headline: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.25,
    color: "dimgray",
  },
  contact: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 1.35,
    color: "dimgray",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 5,
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.45,
  },
  role: {
    marginBottom: 8,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  roleTitle: {
    width: "68%",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  roleDates: {
    width: "30%",
    fontSize: 8,
    lineHeight: 1.25,
    color: "dimgray",
    textAlign: "right",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletMark: {
    width: 10,
    fontSize: 8,
    lineHeight: 1.35,
  },
  bulletText: {
    width: "94%",
    fontSize: 8,
    lineHeight: 1.35,
  },
  skills: {
    fontSize: 8,
    lineHeight: 1.45,
  },
  educationItem: {
    marginBottom: 3,
  },
  educationDegree: {
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  educationDetails: {
    fontSize: 8,
    lineHeight: 1.25,
    color: "dimgray",
  },
});

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildContactLine(profile: ProfileData): string {
  return [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedin_url,
    profile.portfolio_url,
  ]
    .filter(isNonEmptyString)
    .join(" | ");
}

export function createResumeDocument({ profile, resume }: Props): ReactElement<DocumentProps> {
  const displayName = profile.full_name || profile.email || "Resume";
  const contactLine = buildContactLine(profile);

  return (
    <Document
      title={`${displayName} Resume`}
      author={displayName}
      creator="JobPilot"
      producer="JobPilot"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.headline}>{resume.headline}</Text>
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
          <Text style={styles.summary}>{resume.professionalSummary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPERIENCE</Text>
          {resume.workExperience.map((role) => (
            <View key={`${role.company}-${role.title}`} style={styles.role}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>
                  {role.title}, {role.company}
                </Text>
                <Text style={styles.roleDates}>{role.dateRange}</Text>
              </View>
              {role.bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <Text style={styles.bulletMark}>-</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SKILLS</Text>
          <Text style={styles.skills}>{resume.skills.join(" | ")}</Text>
        </View>

        {resume.education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {resume.education.map((education) => (
              <View key={`${education.degree}-${education.details}`} style={styles.educationItem}>
                <Text style={styles.educationDegree}>{education.degree}</Text>
                <Text style={styles.educationDetails}>{education.details}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function ResumeDocument({ profile, resume }: Props) {
  return createResumeDocument({ profile, resume });
}
