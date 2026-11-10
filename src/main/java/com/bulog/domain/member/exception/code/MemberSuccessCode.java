package com.bulog.domain.member.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum MemberSuccessCode implements BaseCode {

    MEMBER_LOGGED_IN(HttpStatus.OK, "MEMBER_200_001", "로그인에 성공했습니다."),
    MEMBER_LOGGED_OUT(HttpStatus.OK, "MEMBER_200_002", "로그아웃에 성공했습니다."),
    MEMBER_FOUND(HttpStatus.OK, "MEMBER_200_003", "회원 정보 조회에 성공했습니다."),
    NICKNAME_CHECKED(HttpStatus.OK, "MEMBER_200_004", "닉네임 사용 가능 여부 조회에 성공했습니다."),
    MEMBER_SIGNED_UP(HttpStatus.CREATED, "MEMBER_201_001", "회원가입에 성공했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    @Override
    public SuccessReasonDTO getReason() {
        return new SuccessReasonDTO(null, true, code, message);
    }

    @Override
    public SuccessReasonDTO getReasonHttpStatus() {
        return new SuccessReasonDTO(httpStatus, true, code, message);
    }
}
