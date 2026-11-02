package com.bulog.domain.quiz.dto.req;

import jakarta.validation.constraints.NotNull;

public record QuizAttemptRequestDTO(
        @NotNull(message = "선택지 ID는 필수입니다.")
        Long selectedOptionId
) {
}
