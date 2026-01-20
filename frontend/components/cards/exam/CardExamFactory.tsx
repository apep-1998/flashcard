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
import AiReviewerExam from "./AiReviewerExam";
import GermanVerbConjugatorExam from "./GermanVerbConjugatorExam";
import MultipleChoiceExam from "./MultipleChoiceExam";
import SpellingExam from "./SpellingExam";
import StandardExam from "./StandardExam";
import WordStandardExam from "./WordStandardExam";

type Props = {
  type: CardType;
  value: CardConfig;
};

export default function CardExamFactory({ type, value }: Props) {
  switch (type) {
    case "spelling":
      return (
        <SpellingExam
          value={value as SpellingConfig}
          onSubmit={() => {}}
        />
      );
    case "multiple-choice":
      return (
        <MultipleChoiceExam
          value={value as MultipleChoiceConfig}
          onSelect={() => {}}
        />
      );
    case "ai-reviewer":
      return (
        <AiReviewerExam
          value={value as AiReviewerConfig}
          onSubmit={async () => {}}
        />
      );
    case "standard":
      return (
        <StandardExam value={value as StandardConfig} onAnswer={() => {}} />
      );
    case "word-standard":
      return (
        <WordStandardExam
          value={value as WordStandardConfig}
          onAnswer={() => {}}
        />
      );
    case "german-verb-conjugator":
      return (
        <GermanVerbConjugatorExam
          value={value as GermanVerbConfig}
          onSubmit={() => {}}
        />
      );
    default:
      return null;
  }
}
