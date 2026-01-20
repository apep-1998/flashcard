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
import AiReviewerView from "./AiReviewerView";
import GermanVerbConjugatorView from "./GermanVerbConjugatorView";
import MultipleChoiceView from "./MultipleChoiceView";
import SpellingView from "./SpellingView";
import StandardView from "./StandardView";
import WordStandardView from "./WordStandardView";

type Props = {
  type: CardType;
  value: CardConfig;
};

export default function CardViewFactory({ type, value }: Props) {
  switch (type) {
    case "spelling":
      return <SpellingView value={value as SpellingConfig} />;
    case "multiple-choice":
      return <MultipleChoiceView value={value as MultipleChoiceConfig} />;
    case "ai-reviewer":
      return <AiReviewerView value={value as AiReviewerConfig} />;
    case "standard":
      return <StandardView value={value as StandardConfig} />;
    case "word-standard":
      return <WordStandardView value={value as WordStandardConfig} />;
    case "german-verb-conjugator":
      return <GermanVerbConjugatorView value={value as GermanVerbConfig} />;
    default:
      return null;
  }
}
