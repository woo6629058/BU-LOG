package com.bulog.domain.member.dto.res;

public record CsrfTokenResponseDTO(
        String headerName,
        String parameterName,
        String token
) {
}
