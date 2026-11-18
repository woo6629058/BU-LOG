package com.bulog.domain.quiz.entity;

import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Arrays;
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

    // 길이를 정하지 않은 Lob은 MySQL에서 TINYTEXT(255바이트)가 되므로 TEXT로 고정한다.
    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    // 화면의 '힌트' 버튼에 보이는 문구. 없으면 힌트 버튼을 숨긴다.
    @Column(length = 500)
    private String hint;

    // 자물쇠 게임의 다이얼 이름(예: 십자가|물결띠|뚜껑 손잡이). 자물쇠가 아니면 비운다.
    @Column(name = "dial_labels", length = 300)
    private String dialLabels;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<QuizOption> options = new ArrayList<>();

    private Quiz(
            Long id,
            String exhibitId,
            String question,
            String explanation,
            String hint,
            List<String> dialLabels,
            List<QuizOption> options
    ) {
        this.id = id;
        this.exhibitId = requireText(exhibitId, "exhibitId");
        this.question = requireText(question, "question");
        this.explanation = requireText(explanation, "explanation");
        this.hint = normalize(hint);
        this.dialLabels = joinDialLabels(dialLabels);
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
        return new Quiz(id, exhibitId, question, explanation, null, null, options);
    }

    public static Quiz create(
            Long id,
            String exhibitId,
            String question,
            String explanation,
            String hint,
            List<String> dialLabels,
            List<QuizOption> options
    ) {
        return new Quiz(id, exhibitId, question, explanation, hint, dialLabels, options);
    }

    /**
     * 미션 내용을 새 값으로 바꾼다. 보기는 내용·정답·순서가 달라졌을 때만 새로 만든다
     * (같으면 보기 ID를 그대로 두어, 화면을 열어 둔 관람객의 제출이 깨지지 않게 한다).
     *
     * @return 보기를 새로 만들었으면 true
     */
    public boolean update(
            String question,
            String explanation,
            String hint,
            List<String> dialLabels,
            List<QuizOption> newOptions
    ) {
        this.question = requireText(question, "question");
        this.explanation = requireText(explanation, "explanation");
        this.hint = normalize(hint);
        this.dialLabels = joinDialLabels(dialLabels);
        if (sameOptions(newOptions)) {
            return false;
        }
        options.clear();
        newOptions.forEach(this::addOption);
        validateOptions();
        return true;
    }

    public List<String> getDialLabelList() {
        return dialLabels == null ? null : Arrays.asList(dialLabels.split("\\|"));
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

    private boolean sameOptions(List<QuizOption> newOptions) {
        if (newOptions.size() != options.size()) {
            return false;
        }
        for (int index = 0; index < options.size(); index++) {
            QuizOption current = options.get(index);
            QuizOption next = newOptions.get(index);
            if (!current.getContent().equals(next.getContent())
                    || current.isCorrect() != next.isCorrect()
                    || current.getDisplayOrder() != next.getDisplayOrder()) {
                return false;
            }
        }
        return true;
    }

    private static String joinDialLabels(List<String> labels) {
        if (labels == null || labels.isEmpty()) {
            return null;
        }
        return labels.stream()
                .map(label -> requireText(label, "dialLabel"))
                .reduce((first, second) -> first + "|" + second)
                .orElse(null);
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value.trim();
    }
}
