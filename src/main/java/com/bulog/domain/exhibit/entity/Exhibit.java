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

    @Column(name = "museum_name", length = 200, nullable = false)
    private String museumName;

    @Column(name = "source_name", length = 100, nullable = false)
    private String sourceName;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    private Exhibit(
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
        this.id = requireText(id, "id");
        this.externalId = normalize(externalId);
        this.name = requireText(name, "name");
        this.era = normalize(era);
        this.description = requireText(description, "description");
        this.imageUrl = normalize(imageUrl);
        this.museumName = requireText(museumName, "museumName");
        this.sourceName = requireText(sourceName, "sourceName");
        this.sourceUrl = normalize(sourceUrl);
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
                sourceUrl
        );
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
}
