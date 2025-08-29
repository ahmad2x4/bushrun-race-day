# Sample CSV Test Data

## Test Files Available:

### `bushrun-runners-small.csv` (5 runners)
- Perfect for quick testing
- 3 × 5K, 2 × 10K runners
- Mix of financial/non-financial members

### `bushrun-runners-30.csv` (30 runners) 
- Realistic race size for testing
- 10 × 5K runners (member #105-192)
- 20 × 10K runners (member #203-398)
- Realistic handicap times:
  - **5K handicaps**: 00:45 - 07:30 (start delay times - lower = earlier start)
  - **10K handicaps**: 03:15 - 15:00 (start delay times - lower = earlier start)
- Mix of financial members (80%) and non-financial (20%)

## CSV Format:
```
member_number,full_name,is_financial_member,distance,current_handicap_5k,current_handicap_10k
105,"Alice Johnson",true,5km,18:30,
203,"Karen Adams",true,10km,,38:15
```

## Usage:
1. Navigate to **Setup** view in the app
2. Upload one of these CSV files
3. Test the complete race workflow

## Handicap Time Ranges (Start Delay Times):
- **5K Fast runners**: 05:00 - 08:00 (start later - minimal advantage)
- **5K Average runners**: 02:00 - 05:00 (start in middle)  
- **5K Slower runners**: 00:00 - 02:00 (start early - maximum advantage)
- **10K Fast runners**: 10:00 - 15:00 (start later - minimal advantage)
- **10K Average runners**: 05:00 - 10:00 (start in middle)
- **10K Slower runners**: 00:00 - 05:00 (start early - maximum advantage)