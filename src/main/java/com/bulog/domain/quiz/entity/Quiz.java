package com.bulog.domain.quiz.entity;

import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "quizzes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quiz extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exhibit_id", length = 100, nullable = false, unique = true)
    private String exhibitId;

    @Column(length = 500, nullable = false)
    private String question;

    @Lob
    @Column(nullable = false)
    private String explanation;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<QuizOption> options = new ArrayList<>();

    private Quiz(
            Long id,
            String exhibitId,
            String question,
            String explanation,
            List<QuizOption> options
    ) {
        this.id = id;
        this.exhibitId = requireText(exhibitId, "exhibitId");
        this.question = requireText(question, "question");
        this.explanation = requireText(explanation, "explanation");
        options.forEach(this::addOption);
        validateOptions();
    }

    public static Quiz create(
            Long id,
            String exhibitId,
            String question,
            String explanation,
            List<QuizOption> options
    ) {
        return new Quiz(id, exhibitId, question, explanation, options);
    }

    public List<QuizOption> getOptions() {
        return Collections.unmodifiableList(options);
    }

    public boolean containsOption(Long optionId) {
        return options.stream().anyMatch(option -> option.hasId(optionId));
    }

    public boolean isCorrectOption(Long optionId) {
        return options.stream()
                .filter(option -> option.hasId(optionId))
                .findFirst()
                .map(QuizOption::isCorrect)
                .orElse(false);
    }

    private void addOption(QuizOption option) {
        QuizOption nonNullOption = Objects.requireNonNull(option, "option must not be null");
        nonNullOption.assignQuiz(this);
        options.add(nonNullOption);
    }

    private void validateOptions() {
        if (options.size() < 2) {
            throw new IllegalArgumentException("quiz must have at least two options");
        }

        long correctOptionCount = options.stream().filter(QuizOption::isCorrect).count();
        if (correctOptionCount != 1) {
            throw new IllegalArgumentException("quiz must have exactly one correct option");
        }
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value.trim();
    }
}
