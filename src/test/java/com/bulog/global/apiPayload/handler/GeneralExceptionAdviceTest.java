package com.bulog.global.apiPayload.handler;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.global.apiPayload.ApiResponse;
import com.bulog.global.apiPayload.code.GeneralErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

class GeneralExceptionAdviceTest {

    private final GeneralExceptionAdvice handler = new GeneralExceptionAdvice();

    @Test
    void 공통_예외의_상태와_코드를_응답한다() {
        GeneralException exception = new GeneralException(GeneralErrorCode.COMMON_404_001);

        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneralException(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().code()).isEqualTo("COMMON_404_001");
    }

    @Test
    void 타입이_다른_요청값을_검증_오류로_응답한다() {
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "wrong",
                Long.class,
                "size",
                null,
                null
        );

        ResponseEntity<ApiResponse<Void>> response = handler.handleMethodArgumentTypeMismatch(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("COMMON_400_002");
    }
}
