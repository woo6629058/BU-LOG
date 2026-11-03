package com.bulog.domain.visitor.entity;

import com.bulog.domain.member.entity.Member;
import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "visitors")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Visitor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", length = 64, nullable = false, unique = true, updatable = false)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private Visitor(Long id, String tokenHash, Member member) {
        this.id = id;
        this.tokenHash = requireText(tokenHash, "tokenHash");
        this.member = member;
    }

    public static Visitor create(Long id, String tokenHash) {
        return new Visitor(id, tokenHash, null);
    }

    public void linkMember(Member member) {
        if (member == null) {
            throw new IllegalArgumentException("member must not be null");
        }
        this.member = member;
    }

    public boolean isLinkedTo(Long memberId) {
        return member != null && member.getId().equals(memberId);
    }

    public boolean isLinkedToAnotherMember(Long memberId) {
        return member != null && !member.getId().equals(memberId);
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value.trim();
    }
}
