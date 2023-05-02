export const code = `


  actor Customer invokes BookRoom
actor HotelManager invokes OpenRoom

aggregate Room  
  handles OpenRoom,   BookRoom, CleanRoom
  emits RoomOpened, RoomBooked,RoomCleaned

  projector Hotel

policy AVeryLongPolicyName
  handles RoomBooked
  invokes CleanRoom

projector

Hotel
  handles   RoomOpened,  RoomBooked



policy OrderPolicy
    handles RoomBooked
  invokes PlaceOrder
  
aggregate Order 
   handles PlaceOrder
  emits   OrderPlaced

  context HotelService
  includes Customer,  HotelManager,Room,AVeryLongPolicyName, Hotel

context OrderService
  includes Order,, , OrderPolicy
  
context AThirdService includes AThirdPolicy

policy AThirdPolicy handles AThirdEvent,AnotherOne

`;
