package com.bulog.domain.exhibit.entity;

import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "exhibits")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Exhibit extends BaseEntity {

    @Id
    @Column(length = 100, nullable = false, updatable = false)
    private String id;

    @Column(name = "external_id", length = 100, unique = true)
    private String externalId;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(length = 100)
    private String era;

    @Lob
    @Column(nullable = false)
    private String description;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "external_image_url", length = 2000)
    private String externalImageUrl;

    @Column(name = "museum_name", length = 200, nullable = false)
    private String museumName;

    @Column(name = "source_name", length = 100, nullable = false)
    private String sourceName;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "exhibition_room", length = 100)
    private String exhibitionRoom;

    @Column(name = "card_number")
    private Integer cardNumber;

    @Column(name = "visit_order")
    private Integer visitOrder;

    @Column(nullable = false)
    private boolean collectible;

    private Exhibit(
            String id,
            String externalId,
            String name,
            String era,
            String description,
            String imageUrl,
            String museumName,
            String sourceName,
            String sourceUrl,
            String externalImageUrl,
            boolean collectible
    ) {
        this.id = requireText(id, "id");
        this.externalId = normalize(externalId);
        this.name = requireText(name, "name");
        this.era = normalize(era);
        this.description = requireText(description, "description");
        this.imageUrl = normalize(imageUrl);
        this.museumName = requireText(museumName, "museumName");
        this.sourceName = requireText(sourceName, "sourceName");
        this.sourceUrl = normalize(sourceUrl);
        this.externalImageUrl = normalize(externalImageUrl);
        this.collectible = collectible;
    }

    public static Exhibit create(
            String id,
            String externalId,
            String name,
            String era,
            String description,
            String imageUrl,
            String museumName,
            String sourceName,
            String sourceUrl
    ) {
        return new Exhibit(
                id,
                externalId,
                name,
                era,
                description,
                imageUrl,
                museumName,
                sourceName,
                sourceUrl,
                null,
                true
        );
    }

    public static Exhibit importFromEmuseum(
            String externalId,
            String name,
            String museumName,
            String externalImageUrl
    ) {
        String imageUrl = normalize(externalImageUrl) == null
                ? null
                : "/api/exhibits/" + externalId + "/image";
        return new Exhibit(
                externalId,
                externalId,
                name,
                null,
                "부천시립박물관 소장품입니다.",
                imageUrl,
                museumName,
                "e뮤지엄",
                "https://www.emuseum.go.kr/",
                externalImageUrl,
                false
        );
    }

    public void updateExternalSummary(
            String name,
            String museumName,
            String externalImageUrl
    ) {
        this.name = requireText(name, "name");
        this.museumName = requireText(museumName, "museumName");
        this.externalImageUrl = normalize(externalImageUrl);
        this.imageUrl = this.externalImageUrl == null
                ? null
                : "/api/exhibits/" + id + "/image";
    }

    public void curate(
            String exhibitionRoom,
            Integer cardNumber,
            Integer visitOrder
    ) {
        this.exhibitionRoom = requireText(exhibitionRoom, "exhibitionRoom");
        this.cardNumber = requirePositive(cardNumber, "cardNumber");
        this.visitOrder = requirePositive(visitOrder, "visitOrder");
        this.collectible = true;
    }

    private static String requireText(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return normalized;
    }

    private static String normalize(String value) {
        return Objects.isNull(value) || value.isBlank() ? null : value.trim();
    }

    private static Integer requirePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
        return value;
    }
}
