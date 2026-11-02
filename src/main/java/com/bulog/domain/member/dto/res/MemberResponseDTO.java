package com.bulog.domain.member.dto.res;

public record MemberResponseDTO(
        Long id,
        String email,
        String nickname
) {
}
