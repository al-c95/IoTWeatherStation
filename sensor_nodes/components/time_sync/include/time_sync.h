#pragma once
#include <stdint.h>
#include <stdbool.h>

// start SNTP
void time_sync_start(void);

// block until time is synced (returns true if successful)
bool time_sync_wait_until_synced(int max_wait_seconds);

// returns true if system time looks valid
bool time_sync_is_valid(void);

// get current UTC time in milliseconds
int64_t time_sync_utc_now_ms(void);