package com.bulog.domain.member.dto.res;

public record NicknameAvailabilityResponseDTO(
        String nickname,
        boolean available
) {
}
