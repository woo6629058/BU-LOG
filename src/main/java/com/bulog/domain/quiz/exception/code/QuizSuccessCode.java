package com.bulog.domain.quiz.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import org.springframework.http.HttpStatus;

public enum QuizSuccessCode implements BaseCode {

    QUIZ_FOUND(HttpStatus.OK, "QUIZ_200_001", "퀴즈 조회에 성공했습니다."),
    QUIZ_GRADED(HttpStatus.OK, "QUIZ_200_002", "퀴즈 채점에 성공했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    QuizSuccessCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    @Override
    public SuccessReasonDTO getReason() {
        return new SuccessReasonDTO(null, true, code, message);
    }

    @Override
    public SuccessReasonDTO getReasonHttpStatus() {
        return new SuccessReasonDTO(httpStatus, true, code, message);
    }
}
