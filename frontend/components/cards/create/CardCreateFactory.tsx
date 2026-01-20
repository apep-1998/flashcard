import type {
  AiReviewerConfig,
  CardConfig,
  CardType,
  GermanVerbConfig,
  MultipleChoiceConfig,
  SpellingConfig,
  StandardConfig,
  WordStandardConfig,
} from "@/lib/schemas/cards";
import AiReviewerCreate from "./AiReviewerCreate";
import GermanVerbConjugatorCreate from "./GermanVerbConjugatorCreate";
import MultipleChoiceCreate from "./MultipleChoiceCreate";
import SpellingCreate from "./SpellingCreate";
import StandardCreate from "./StandardCreate";
import WordStandardCreate from "./WordStandardCreate";

type Props = {
  type: CardType;
  value: CardConfig;
  onChange: (next: CardConfig) => void;
};

export default function CardCreateFactory({ type, value, onChange }: Props) {
  switch (type) {
    case "spelling":
      return (
        <SpellingCreate
          value={value as SpellingConfig}
          onChange={onChange as (next: SpellingConfig) => void}
        />
      );
    case "multiple-choice":
      return (
        <MultipleChoiceCreate
          value={value as MultipleChoiceConfig}
          onChange={onChange as (next: MultipleChoiceConfig) => void}
        />
      );
    case "ai-reviewer":
      return (
        <AiReviewerCreate
          value={value as AiReviewerConfig}
          onChange={onChange as (next: AiReviewerConfig) => void}
        />
      );
    case "standard":
      return (
        <StandardCreate
          value={value as StandardConfig}
          onChange={onChange as (next: StandardConfig) => void}
        />
      );
    case "word-standard":
      return (
        <WordStandardCreate
          value={value as WordStandardConfig}
          onChange={onChange as (next: WordStandardConfig) => void}
        />
      );
    case "german-verb-conjugator":
      return (
        <GermanVerbConjugatorCreate
          value={value as GermanVerbConfig}
          onChange={onChange as (next: GermanVerbConfig) => void}
        />
      );
    default:
      return null;
  }
}
