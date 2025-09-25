import { Calendar, MapPin, Users } from "lucide-react";
import { defineField, defineType } from "sanity";

import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import { seoFields } from "../../utils/seo-fields";
import { createSlug, isUniqueForLanguage } from "../../utils/slug";

export const job = defineType({
  name: "job",
  type: "document",
  title: "Job Advertisement",
  icon: Users,
  groups: GROUPS,
  fields: [
    defineField({
      name: "language",
      type: "string",
      title: "Language",
      description: "The language of this job advertisement",
      group: GROUP.MAIN_CONTENT,
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Job Title",
      description: "The title of the position",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "URL",
      description: "The web address for this job posting",
      group: GROUP.MAIN_CONTENT,
      options: {
        source: "title",
        slugify: createSlug,
        isUnique: isUniqueForLanguage,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      title: "Department",
      description: "The department this job belongs to",
      group: GROUP.MAIN_CONTENT,
      to: [{ type: "department" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      type: "string",
      title: "Location",
      description:
        "Where this job is located (e.g., 'Stockholm, Sweden', 'Remote', 'London, UK')",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "employmentType",
      type: "string",
      title: "Employment Type",
      description: "The type of employment",
      group: GROUP.MAIN_CONTENT,
      options: {
        list: [
          { title: "Full-time", value: "full-time" },
          { title: "Part-time", value: "part-time" },
          { title: "Contract", value: "contract" },
          { title: "Internship", value: "internship" },
          { title: "Temporary", value: "temporary" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "experienceLevel",
      type: "string",
      title: "Experience Level",
      description: "Required experience level",
      group: GROUP.MAIN_CONTENT,
      options: {
        list: [
          { title: "Entry Level", value: "entry" },
          { title: "Mid Level", value: "mid" },
          { title: "Senior Level", value: "senior" },
          { title: "Lead/Principal", value: "lead" },
          { title: "Executive", value: "executive" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "salary",
      type: "object",
      title: "Salary Information",
      description: "Salary details (optional)",
      group: GROUP.MAIN_CONTENT,
      fields: [
        defineField({
          name: "min",
          type: "number",
          title: "Minimum Salary",
          description: "Minimum salary (in local currency)",
        }),
        defineField({
          name: "max",
          type: "number",
          title: "Maximum Salary",
          description: "Maximum salary (in local currency)",
        }),
        defineField({
          name: "currency",
          type: "string",
          title: "Currency",
          description: "Currency code (e.g., SEK, EUR, USD)",
          options: {
            list: [
              { title: "Swedish Krona (SEK)", value: "SEK" },
              { title: "Euro (EUR)", value: "EUR" },
              { title: "US Dollar (USD)", value: "USD" },
              { title: "British Pound (GBP)", value: "GBP" },
            ],
          },
        }),
        defineField({
          name: "period",
          type: "string",
          title: "Period",
          description: "Salary period",
          options: {
            list: [
              { title: "Per month", value: "month" },
              { title: "Per year", value: "year" },
              { title: "Per hour", value: "hour" },
            ],
          },
        }),
        defineField({
          name: "isPublic",
          type: "boolean",
          title: "Show Salary",
          description: "Whether to display salary information publicly",
          initialValue: false,
        }),
      ],
    }),
    defineField({
      name: "applicationDeadline",
      type: "date",
      title: "Application Deadline",
      description: "Last date to apply for this position",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "startDate",
      type: "date",
      title: "Start Date",
      description: "Expected start date for the position",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "shortDescription",
      type: "text",
      title: "Short Description",
      description: "Brief summary of the job (used in listings)",
      group: GROUP.MAIN_CONTENT,
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: "description",
      type: "richText",
      title: "Job Description",
      description: "Detailed description of the role and responsibilities",
      group: GROUP.MAIN_CONTENT,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "requirements",
      type: "richText",
      title: "Requirements",
      description: "Required skills, experience, and qualifications",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "benefits",
      type: "richText",
      title: "Benefits & Perks",
      description: "What the company offers",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "applicationProcess",
      type: "richText",
      title: "Application Process",
      description: "How to apply for this position",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "contactPerson",
      type: "object",
      title: "Contact Information",
      description: "Who to contact about this position",
      group: GROUP.MAIN_CONTENT,
      fields: [
        defineField({
          name: "name",
          type: "string",
          title: "Contact Name",
        }),
        defineField({
          name: "email",
          type: "email",
          title: "Contact Email",
        }),
        defineField({
          name: "phone",
          type: "string",
          title: "Contact Phone",
        }),
      ],
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      title: "Active",
      description:
        "Whether this job posting is currently active and accepting applications",
      group: GROUP.MAIN_CONTENT,
      initialValue: true,
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
      title: "Featured",
      description: "Whether to feature this job prominently in listings",
      group: GROUP.MAIN_CONTENT,
      initialValue: false,
    }),
    defineField({
      name: "viewCount",
      type: "number",
      title: "View Count",
      description: "Number of times this job has been viewed",
      group: GROUP.MAIN_CONTENT,
      readOnly: true,
      initialValue: 0,
    }),
    ...seoFields,
    ...ogFields,
  ],
  preview: {
    select: {
      title: "title",
      location: "location",
      employmentType: "employmentType",
      isActive: "isActive",
      isFeatured: "isFeatured",
    },
    prepare({ title, location, employmentType, isActive, isFeatured }) {
      const status = isFeatured
        ? "⭐ Featured"
        : isActive
          ? "Active"
          : "Inactive";
      return {
        title: title,
        subtitle: `${location} • ${employmentType} • ${status}`,
        media: Users,
      };
    },
  },
  orderings: [
    {
      title: "Featured First",
      name: "featuredFirst",
      by: [
        { field: "isFeatured", direction: "desc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
    {
      title: "Newest First",
      name: "newestFirst",
      by: [{ field: "_createdAt", direction: "desc" }],
    },
    {
      title: "Application Deadline",
      name: "deadlineAsc",
      by: [{ field: "applicationDeadline", direction: "asc" }],
    },
    {
      title: "Job Title A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
});
