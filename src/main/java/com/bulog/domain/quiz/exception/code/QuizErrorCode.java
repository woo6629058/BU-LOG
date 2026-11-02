package com.bulog.domain.quiz.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import org.springframework.http.HttpStatus;

public enum QuizErrorCode implements BaseErrorCode {

    QUIZ_NOT_FOUND(HttpStatus.NOT_FOUND, "QUIZ_404_001", "퀴즈를 찾을 수 없습니다."),
    QUIZ_OPTION_INVALID(HttpStatus.BAD_REQUEST, "QUIZ_400_001", "해당 퀴즈의 선택지가 아닙니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    QuizErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    @Override
    public ErrorReasonDTO getReason() {
        return new ErrorReasonDTO(null, false, code, message);
    }

    @Override
    public ErrorReasonDTO getReasonHttpStatus() {
        return new ErrorReasonDTO(httpStatus, false, code, message);
    }
}
