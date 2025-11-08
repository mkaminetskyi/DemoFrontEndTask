package com.demo.demotaskforfeside.service;

import com.demo.demotaskforfeside.dto.PriceListItem;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PriceListService {

    public List<PriceListItem> loadPriceList() {

        return new ArrayList<>();
    }
}
