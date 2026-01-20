import { z } from "zod";

export const boxSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const optionalUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().min(1).optional(),
);

const optionalText = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().min(1).optional(),
);

const ttsFields = {
  text_to_speech: optionalText,
  text_to_speech_language: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().min(1).optional(),
  ),
};

export const spellingConfigSchema = z
  .object({
    type: z.literal("spelling"),
    voice_file_url: optionalUrl,
    ...ttsFields,
    spelling: z.string().min(1, "Spelling is required."),
  })
  .refine(
    (value) => Boolean(value.voice_file_url || value.text_to_speech),
    {
      message: "Voice file URL or text-to-speech text is required.",
      path: ["voice_file_url"],
    },
  )
  .refine(
    (value) => !value.text_to_speech || value.text_to_speech_language,
    {
      message: "Text-to-speech language is required.",
      path: ["text_to_speech_language"],
    },
  );

export const multipleChoiceConfigSchema = z
  .object({
    type: z.literal("multiple-choice"),
    question: z.string().min(1, "Question is required."),
    voice_file_url: optionalUrl,
    ...ttsFields,
    image_file_url: optionalUrl,
    answer: z.string().min(1, "Answer is required."),
    options: z.array(z.string().min(1)).min(2, "Add at least two options."),
  })
  .refine(
    (value) => !value.text_to_speech || value.text_to_speech_language,
    {
      message: "Text-to-speech language is required.",
      path: ["text_to_speech_language"],
    },
  );

export const aiReviewerConfigSchema = z.object({
  type: z.literal("ai-reviewer"),
  question: z.string().min(1, "Question is required."),
  validate_answer_promt: z
    .string()
    .min(1, "Validation prompt is required."),
});

export const standardConfigSchema = z
  .object({
    type: z.literal("standard"),
    front: z.string().min(1, "Front is required."),
    back: z.string().min(1, "Back is required."),
    front_voice_file_url: optionalUrl,
    back_voice_file_url: optionalUrl,
    front_text_to_speech: optionalText,
    front_text_to_speech_language: optionalText,
    back_text_to_speech: optionalText,
    back_text_to_speech_language: optionalText,
  })
  .refine(
    (value) => !value.front_text_to_speech || value.front_text_to_speech_language,
    {
      message: "Front text-to-speech language is required.",
      path: ["front_text_to_speech_language"],
    },
  )
  .refine(
    (value) => !value.back_text_to_speech || value.back_text_to_speech_language,
    {
      message: "Back text-to-speech language is required.",
      path: ["back_text_to_speech_language"],
    },
  );

export const wordStandardConfigSchema = z
  .object({
    type: z.literal("word-standard"),
    word: z.string().min(1, "Word is required."),
    part_of_speech: z.string().min(1, "Part of speech is required."),
    voice_file_url: optionalUrl,
    ...ttsFields,
    back: z.string().min(1, "Back content is required."),
  })
  .refine(
    (value) => Boolean(value.voice_file_url || value.text_to_speech),
    {
      message: "Voice file URL or text-to-speech text is required.",
      path: ["voice_file_url"],
    },
  )
  .refine(
    (value) => !value.text_to_speech || value.text_to_speech_language,
    {
      message: "Text-to-speech language is required.",
      path: ["text_to_speech_language"],
    },
  );

export const germanVerbConfigSchema = z
  .object({
    type: z.literal("german-verb-conjugator"),
    verb: z.string().min(1, "Verb is required."),
    voice_file_url: optionalUrl,
    ...ttsFields,
    ich: z.string().min(1, "ich is required."),
    du: z.string().min(1, "du is required."),
    "er/sie/es": z.string().min(1, "er/sie/es is required."),
    wir: z.string().min(1, "wir is required."),
    ihr: z.string().min(1, "ihr is required."),
    sie: z.string().min(1, "sie is required."),
  })
  .refine(
    (value) => !value.text_to_speech || value.text_to_speech_language,
    {
      message: "Text-to-speech language is required.",
      path: ["text_to_speech_language"],
    },
  );

export const cardConfigSchema = z.discriminatedUnion("type", [
  spellingConfigSchema,
  multipleChoiceConfigSchema,
  aiReviewerConfigSchema,
  standardConfigSchema,
  wordStandardConfigSchema,
  germanVerbConfigSchema,
]);

export const cardSchema = z.object({
  boxId: z.number(),
  userId: z.string(),
  finished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  level: z.number().int().min(0),
  groupId: z.string(),
  nextReviewTime: z.string().nullable(),
  config: cardConfigSchema,
});

export type SpellingConfig = z.infer<typeof spellingConfigSchema>;
export type MultipleChoiceConfig = z.infer<typeof multipleChoiceConfigSchema>;
export type AiReviewerConfig = z.infer<typeof aiReviewerConfigSchema>;
export type StandardConfig = z.infer<typeof standardConfigSchema>;
export type WordStandardConfig = z.infer<typeof wordStandardConfigSchema>;
export type GermanVerbConfig = z.infer<typeof germanVerbConfigSchema>;
export type CardConfig = z.infer<typeof cardConfigSchema>;
export type CardType = CardConfig["type"];
