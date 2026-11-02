package com.bulog.domain.quiz.dto.res;

public record QuizAttemptResponseDTO(
        boolean correct,
        String explanation
) {
}
