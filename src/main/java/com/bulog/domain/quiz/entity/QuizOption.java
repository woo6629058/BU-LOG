package com.bulog.domain.quiz.entity;

import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "quiz_options")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(length = 300, nullable = false)
    private String content;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    private QuizOption(Long id, String content, boolean correct, int displayOrder) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content must not be blank");
        }
        if (displayOrder < 1) {
            throw new IllegalArgumentException("displayOrder must be positive");
        }

        this.id = id;
        this.content = content.trim();
        this.correct = correct;
        this.displayOrder = displayOrder;
    }

    public static QuizOption create(Long id, String content, boolean correct, int displayOrder) {
        return new QuizOption(id, content, correct, displayOrder);
    }

    public boolean hasId(Long optionId) {
        return id != null && id.equals(optionId);
    }

    void assignQuiz(Quiz quiz) {
        this.quiz = quiz;
    }
}
