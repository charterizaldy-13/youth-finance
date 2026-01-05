import { cn } from "@/lib/utils";

interface GeneratingLoaderProps {
    text?: string;
    className?: string;
}

export const GeneratingLoader = ({ text = "Generating", className }: GeneratingLoaderProps) => {
    const letters = text.split("");

    return (
        <div className={cn("generating-loader-wrapper", className)}>
            <div className="generating-loader-text">
                {letters.map((letter, index) => (
                    <span
                        key={index}
                        className="generating-loader-letter"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {letter}
                    </span>
                ))}
            </div>
            <div className="generating-loader-bar"></div>
        </div>
    );
};

export default GeneratingLoader;
