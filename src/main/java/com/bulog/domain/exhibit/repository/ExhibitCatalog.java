package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.List;

public interface ExhibitCatalog extends ExhibitReader {

    List<Exhibit> findAll();
}
