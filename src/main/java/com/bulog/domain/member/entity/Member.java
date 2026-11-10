package com.bulog.domain.member.entity;

import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    /** 닉네임 규칙: 한글·영문·숫자 2~10자 (명예의 전당 순위표에 그대로 표시된다). */
    public static final String NICKNAME_REGEX = "^[가-힣A-Za-z0-9]{2,10}$";
    private static final Pattern NICKNAME_PATTERN = Pattern.compile(NICKNAME_REGEX);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", length = 100, nullable = false)
    private String passwordHash;

    @Column(length = 30, nullable = false, unique = true)
    private String nickname;

    /** 필수: 서비스 이용약관 동의 시각 */
    @Column(name = "terms_agreed_at")
    private LocalDateTime termsAgreedAt;

    /** 필수: 개인정보 수집·이용 동의 시각 */
    @Column(name = "privacy_agreed_at")
    private LocalDateTime privacyAgreedAt;

    /** 선택: 마케팅 정보 수신 동의 시각 (동의하지 않으면 null) */
    @Column(name = "marketing_agreed_at")
    private LocalDateTime marketingAgreedAt;

    private Member(Long id, String email, String passwordHash, String nickname) {
        this.id = id;
        this.email = normalizeEmail(email);
        this.passwordHash = requireText(passwordHash, "passwordHash");
        this.nickname = normalizeNickname(nickname);
    }

    public static Member create(Long id, String email, String passwordHash, String nickname) {
        return new Member(id, email, passwordHash, nickname);
    }

    /** 회원가입: 필수 약관 동의 시각을 함께 기록한다. */
    public static Member signUp(
            String email,
            String passwordHash,
            String nickname,
            LocalDateTime agreedAt,
            boolean marketingAgreed
    ) {
        if (agreedAt == null) {
            throw new IllegalArgumentException("agreedAt must not be null");
        }
        Member member = new Member(null, email, passwordHash, nickname);
        member.termsAgreedAt = agreedAt;
        member.privacyAgreedAt = agreedAt;
        member.marketingAgreedAt = marketingAgreed ? agreedAt : null;
        return member;
    }

    /** 같은 내용에 id만 붙인 사본 (DB 없이 실행하는 local 저장소에서 사용). */
    public Member withId(Long newId) {
        Member copy = new Member(newId, email, passwordHash, nickname);
        copy.termsAgreedAt = termsAgreedAt;
        copy.privacyAgreedAt = privacyAgreedAt;
        copy.marketingAgreedAt = marketingAgreedAt;
        return copy;
    }

    public static String normalizeEmail(String email) {
        return requireText(email, "email").toLowerCase(Locale.ROOT);
    }

    public static String normalizeNickname(String nickname) {
        return requireText(nickname, "nickname");
    }

    public static boolean isValidNickname(String nickname) {
        return nickname != null && NICKNAME_PATTERN.matcher(nickname.trim()).matches();
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value.trim();
    }
}
